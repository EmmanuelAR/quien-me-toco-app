import "server-only";
import { readExclusions, readGroup, readParticipants, readReveal } from "@/lib/contract/reads";
import { calls } from "@/lib/contract/calls";
import { GroupStatus, type Group, type Participant } from "@/lib/contract/types";
import { assign, type DrawConstraints } from "@/lib/draw/assign";
import { buildDrawArtifacts } from "@/lib/draw/pipeline";
import { randomBytes, toBase64Url } from "@/lib/crypto/random";
import { serverEnv } from "./env";
import { keys, kv, ttlForEvent } from "./kv";
import { withLock } from "./lock";
import { sendServerTx } from "./starknet-account";

export type DrawResult =
  | { ok: true; already: boolean; txHash: string | null }
  | { ok: false; reason: "wrong-status" | "infeasible"; status: number };

/** identidad estable de un participante entre grupos: cuenta, o nombre si es sin cuenta */
export function identityKey(p: Participant): string {
  return p.isGhost ? `ghost:${p.name.trim().toLowerCase()}` : `acct:${p.account.toLowerCase()}`;
}

/**
 * previous[i] = índice (en este grupo) de a quién le regaló i el año pasado, o null.
 * se arma con la revelación pública del grupo anterior.
 */
export async function previousAssignments(group: Group, participants: Participant[]): Promise<Array<number | null> | undefined> {
  if (!group.avoidPrevious || group.previousGroupId === 0n) return undefined;
  const [prevParticipants, prevReveal] = await Promise.all([
    readParticipants(group.previousGroupId),
    readReveal(group.previousGroupId),
  ]);
  if (!prevReveal) return undefined;
  const prevIndexByKey = new Map(prevParticipants.map((p, i) => [identityKey(p), i]));
  const newIndexByKey = new Map(participants.map((p, i) => [identityKey(p), i]));
  return participants.map((p) => {
    const prevIdx = prevIndexByKey.get(identityKey(p));
    if (prevIdx === undefined) return null;
    const prevReceiver = prevParticipants[prevReveal.receivers[prevIdx]];
    if (!prevReceiver) return null;
    return newIndexByKey.get(identityKey(prevReceiver)) ?? null;
  });
}

export async function constraintsFor(group: Group, participants: Participant[]): Promise<DrawConstraints> {
  const exclusions = await readExclusions(group.id);
  return {
    n: participants.length,
    pairs: exclusions.map((e) => [e.a, e.b] as [number, number]),
    previous: await previousAssignments(group, participants),
  };
}

/**
 * el sorteo. solo actúa si la admin ya pidió el sorteo en el contrato (DrawRequested).
 * calcula la permutación, sella cada papelito, lo cifra para quien regala y publica todo.
 */
export async function runDraw(groupId: bigint): Promise<DrawResult> {
  return withLock(`draw:${groupId}`, 170, async () => {
    const group = await readGroup(groupId);
    if (group.status >= GroupStatus.Drawn) return { ok: true, already: true, txHash: null };
    if (group.status !== GroupStatus.DrawRequested) return { ok: false, reason: "wrong-status", status: group.status };

    const participants = await readParticipants(groupId);
    const constraints = await constraintsFor(group, participants);
    const receivers = assign(constraints);
    if (!receivers) return { ok: false, reason: "infeasible", status: group.status };

    const { commitments, ciphertexts, sealedReveal } = buildDrawArtifacts(
      groupId,
      participants.map((p) => ({ encPubkey: p.encPubkey, isGhost: p.isGhost })),
      receivers,
      serverEnv.encPublicKey,
    );

    const { transactionHash } = await sendServerTx(calls.publishDraw(groupId, commitments, ciphertexts, sealedReveal));

    // links privados para los sin cuenta
    const store = kv();
    const ttl = ttlForEvent(group.eventAt);
    await store.set(keys.drawTx(groupId), transactionHash, { ex: ttl });
    for (let i = 0; i < participants.length; i++) {
      if (!participants[i].isGhost) continue;
      const token = toBase64Url(randomBytes(24));
      await store.set(keys.ghost(token), { groupId: groupId.toString(), index: i }, { ex: ttl });
      await store.set(keys.ghostToken(groupId, i), token, { ex: ttl });
    }

    return { ok: true, already: false, txHash: transactionHash };
  });
}
