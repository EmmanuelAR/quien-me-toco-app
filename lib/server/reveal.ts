import "server-only";
import { readGroup, readKeyVersions, readParticipants } from "@/lib/contract/reads";
import { calls } from "@/lib/contract/calls";
import { GroupStatus } from "@/lib/contract/types";
import { encodeSlip } from "@/lib/crypto/commitments";
import { seal, slotAad } from "@/lib/crypto/sealedbox";
import { openRevealPackage } from "./emails";
import { keys, kv, ttlForEvent } from "./kv";
import { withLock } from "./lock";
import { sendServerTx } from "./starknet-account";

export type RevealResult =
  | { ok: true; already: boolean; txHash: string | null }
  | { ok: false; reason: "wrong-status"; status: number };

/**
 * la revelación. solo actúa si la admin ya la pidió en el contrato (RevealRequested).
 * abre el paquete sellado para el servidor y publica permutación + salts; el contrato
 * verifica que coincidan con los sellos del sorteo o rechaza la tx.
 */
export async function runReveal(groupId: bigint): Promise<RevealResult> {
  return withLock(`reveal:${groupId}`, 170, async () => {
    const group = await readGroup(groupId);
    if (group.status === GroupStatus.Revealed) return { ok: true, already: true, txHash: null };
    if (group.status !== GroupStatus.RevealRequested) return { ok: false, reason: "wrong-status", status: group.status };

    const pkg = await openRevealPackage(groupId);
    const { transactionHash } = await sendServerTx(calls.reveal(groupId, pkg.receivers, pkg.salts));
    await kv().set(keys.revealTx(groupId), transactionHash, { ex: ttlForEvent(group.eventAt) });
    return { ok: true, already: false, txHash: transactionHash };
  });
}

export type ReencryptResult =
  | { ok: true; txHash: string }
  | { ok: false; reason: "wrong-status" | "up-to-date" | "bad-index" | "ghost" };

/**
 * re-cifra el papelito de un participante que rotó su llave (otro teléfono).
 * el contrato solo acepta el nuevo cifrado si la versión de la llave es mayor que la del cifrado.
 */
export async function runReencrypt(groupId: bigint, index: number): Promise<ReencryptResult> {
  return withLock(`reencrypt:${groupId}:${index}`, 120, async () => {
    const group = await readGroup(groupId);
    if (group.status !== GroupStatus.Drawn && group.status !== GroupStatus.RevealRequested) {
      return { ok: false, reason: "wrong-status" };
    }
    const participants = await readParticipants(groupId);
    const p = participants[index];
    if (!p) return { ok: false, reason: "bad-index" };
    if (p.isGhost) return { ok: false, reason: "ghost" };
    const versions = await readKeyVersions(groupId, index);
    if (versions.key <= versions.ct) return { ok: false, reason: "up-to-date" };

    const pkg = await openRevealPackage(groupId);
    const ct = seal(p.encPubkey, encodeSlip({ receiver: pkg.receivers[index], salt: pkg.salts[index] }), slotAad(groupId, index));
    const { transactionHash } = await sendServerTx(calls.updateCiphertext(groupId, index, ct));
    return { ok: true, txHash: transactionHash };
  });
}
