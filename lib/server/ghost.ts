import "server-only";
import { readGroup, readParticipants, readWishlist } from "@/lib/contract/reads";
import { GroupStatus, type Wishlist } from "@/lib/contract/types";
import { randomBytes, toBase64Url } from "@/lib/crypto/random";
import { openRevealPackage } from "./emails";
import { keys, kv, ttlForEvent } from "./kv";
import { serverEnv } from "./env";

interface GhostRecord {
  groupId: string;
  index: number;
}

export type GhostView =
  | { kind: "slip"; groupId: string; groupName: string; eventAt: number; place: string; budgetMin: number; budgetMax: number; currency: string; giverName: string; receiverName: string; receiverIndex: number; wishlist: Wishlist; deviceToken: string }
  | { kind: "revealed"; groupId: string }
  | { kind: "used" }
  | { kind: "invalid" };

/**
 * canjea un link privado. la primera vez marca el token como usado (atómico) y entrega
 * un deviceToken para volver a abrir en el mismo teléfono. en otro teléfono, el link
 * ya no sirve.
 */
export async function redeemGhostLink(token: string, deviceToken?: string | null): Promise<GhostView> {
  const store = kv();
  const rec = await store.get<GhostRecord>(keys.ghost(token));
  if (!rec) return { kind: "invalid" };
  const groupId = BigInt(rec.groupId);
  const group = await readGroup(groupId);
  if (group.status === GroupStatus.Revealed) return { kind: "revealed", groupId: rec.groupId };
  const ttl = ttlForEvent(group.eventAt);

  let device = deviceToken ?? null;
  if (device) {
    const sess = await store.get<GhostRecord>(keys.ghostSession(device));
    if (!sess || sess.groupId !== rec.groupId || sess.index !== rec.index) device = null;
  }
  if (!device) {
    const fresh = await store.set(keys.ghostUsed(token), "1", { ex: ttl, nx: true });
    if (!fresh) return { kind: "used" };
    device = toBase64Url(randomBytes(24));
    await store.set(keys.ghostSession(device), rec, { ex: ttl });
  }

  const [participants, pkg] = await Promise.all([readParticipants(groupId), openRevealPackage(groupId)]);
  const giver = participants[rec.index];
  const receiverIndex = pkg.receivers[rec.index];
  const receiver = participants[receiverIndex];
  if (!giver || !receiver) return { kind: "invalid" };
  const wishlist = await readWishlist(groupId, receiverIndex);
  return {
    kind: "slip",
    groupId: rec.groupId,
    groupName: group.name,
    eventAt: group.eventAt,
    place: group.place,
    budgetMin: group.budgetMin,
    budgetMax: group.budgetMax,
    currency: group.currency || "CRC",
    giverName: giver.name,
    receiverName: receiver.name,
    receiverIndex,
    wishlist,
    deviceToken: device,
  };
}

export interface GhostLink {
  index: number;
  name: string;
  url: string;
  used: boolean;
}

/** los links privados de un grupo, para que la admin los copie (ella no ve el resultado) */
export async function ghostLinks(groupId: bigint): Promise<GhostLink[]> {
  const store = kv();
  const participants = await readParticipants(groupId);
  const out: GhostLink[] = [];
  for (let i = 0; i < participants.length; i++) {
    if (!participants[i].isGhost) continue;
    const token = await store.get<string>(keys.ghostToken(groupId, i));
    if (!token) continue;
    const used = Boolean(await store.get(keys.ghostUsed(token)));
    out.push({ index: i, name: participants[i].name, url: `${serverEnv.appUrl}/p/${token}`, used });
  }
  return out;
}
