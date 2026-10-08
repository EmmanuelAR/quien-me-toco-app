import { CairoOption, num, shortString } from "starknet";
import { getContract } from "./client";
import {
  type Exclusion,
  type Group,
  type GroupStatusValue,
  type Participant,
  type Reveal,
  type Wishlist,
} from "./types";
import { bigIntToBytes } from "@/lib/crypto/random";

/* ---------- decodificación de respuestas de starknet.js ---------- */

function toAddress(v: unknown): string {
  const b = BigInt(v as bigint | string | number);
  return "0x" + b.toString(16).padStart(64, "0");
}

function toNumber(v: unknown): number {
  return Number(BigInt(v as bigint | string | number));
}

function toBytes32(v: unknown): Uint8Array {
  return bigIntToBytes(BigInt(v as bigint | string | number), 32);
}

function toText(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "");
}

function decodeGroup(id: bigint, raw: Record<string, unknown>, participantCount: number, archived: boolean): Group {
  return {
    id,
    admin: toAddress(raw.admin),
    name: toText(raw.name),
    eventAt: toNumber(raw.event_at),
    place: toText(raw.place),
    budgetMin: toNumber(raw.budget_min),
    budgetMax: toNumber(raw.budget_max),
    currency: decodeShortString(raw.currency),
    rules: toText(raw.rules),
    expectedCount: toNumber(raw.expected_count),
    previousGroupId: BigInt(raw.previous_group_id as bigint),
    avoidPrevious: Boolean(raw.avoid_previous),
    status: toNumber(raw.status) as GroupStatusValue,
    drawnAt: toNumber(raw.drawn_at),
    revealedAt: toNumber(raw.revealed_at),
    participantCount,
    archived,
  };
}

function decodeShortString(v: unknown): string {
  try {
    const b = BigInt(v as bigint);
    if (b === 0n) return "";
    return shortString.decodeShortString(num.toHex(b));
  } catch {
    return "";
  }
}

function decodeParticipant(index: number, raw: Record<string, unknown>): Participant {
  return {
    index,
    account: toAddress(raw.account),
    name: toText(raw.name),
    encPubkey: toBytes32(raw.enc_pubkey),
    emailCommit: toBytes32(raw.email_commit),
    isGhost: Boolean(raw.is_ghost),
  };
}

function decodeWishlist(raw: Record<string, unknown>): Wishlist {
  return { ideas: toText(raw.ideas), sizes: toText(raw.sizes), links: toText(raw.links) };
}

/* ---------- lecturas ---------- */

export async function readGroup(groupId: bigint): Promise<Group> {
  const c = getContract();
  const [raw, count, archived] = await Promise.all([
    c.call("get_group", [groupId]) as Promise<Record<string, unknown>>,
    c.call("get_participant_count", [groupId]) as Promise<bigint>,
    c.call("is_archived", [groupId]) as Promise<boolean>,
  ]);
  return decodeGroup(groupId, raw, toNumber(count), Boolean(archived));
}

/** null si el grupo no existe */
export async function readGroupSafe(groupId: bigint): Promise<Group | null> {
  try {
    return await readGroup(groupId);
  } catch {
    return null;
  }
}

export async function readParticipants(groupId: bigint): Promise<Participant[]> {
  const raw = (await getContract().call("get_participants", [groupId])) as Record<string, unknown>[];
  return raw.map((p, i) => decodeParticipant(i, p));
}

export async function readParticipantIndex(groupId: bigint, account: string): Promise<number | null> {
  const raw = (await getContract().call("get_participant_index", [groupId, account])) as
    | CairoOption<bigint>
    | { Some?: bigint; None?: unknown }
    | undefined;
  if (!raw) return null;
  if (raw instanceof CairoOption) {
    return raw.isSome() ? toNumber(raw.unwrap()) : null;
  }
  if (typeof raw === "object" && "Some" in raw && raw.Some !== undefined) return toNumber(raw.Some);
  return null;
}

export async function readWishlist(groupId: bigint, index: number): Promise<Wishlist> {
  const raw = (await getContract().call("get_wishlist", [groupId, index])) as Record<string, unknown>;
  return decodeWishlist(raw);
}

export async function readExclusions(groupId: bigint): Promise<Exclusion[]> {
  const raw = (await getContract().call("get_exclusions", [groupId])) as Record<string, unknown>[];
  return raw.map((e) => ({ a: toNumber(e.a), b: toNumber(e.b) }));
}

export async function readCiphertext(groupId: bigint, index: number): Promise<Uint8Array> {
  const raw = (await getContract().call("get_ciphertext", [groupId, index], { parseResponse: false })) as string[];
  return decodeByteArrayFelts(raw);
}

export async function readCommitments(groupId: bigint): Promise<bigint[]> {
  const raw = (await getContract().call("get_commitments", [groupId])) as bigint[];
  return raw.map((c) => BigInt(c));
}

export async function readSealedReveal(groupId: bigint): Promise<Uint8Array> {
  const raw = (await getContract().call("get_sealed_reveal", [groupId], { parseResponse: false })) as string[];
  return decodeByteArrayFelts(raw);
}

export async function readReveal(groupId: bigint): Promise<Reveal | null> {
  const raw = (await getContract().call("get_reveal", [groupId])) as Record<string, unknown>;
  const receivers = ((raw["0"] ?? []) as bigint[]).map(toNumber);
  const salts = ((raw["1"] ?? []) as bigint[]).map((s) => BigInt(s));
  if (receivers.length === 0) return null;
  return { receivers, salts };
}

export async function readKeyVersions(groupId: bigint, index: number): Promise<{ key: number; ct: number }> {
  const raw = (await getContract().call("get_key_versions", [groupId, index])) as Record<string, unknown>;
  return { key: toNumber(raw["0"]), ct: toNumber(raw["1"]) };
}

export async function readGroupsOfAdmin(account: string): Promise<bigint[]> {
  const raw = (await getContract().call("groups_of_admin", [account])) as bigint[];
  return raw.map((g) => BigInt(g));
}

export async function readGroupsOfParticipant(account: string): Promise<bigint[]> {
  const raw = (await getContract().call("groups_of_participant", [account])) as bigint[];
  return raw.map((g) => BigInt(g));
}

/* ---------- ByteArray binario ---------- */

/**
 * los ciphertexts son bytes arbitrarios. starknet.js serializa un Uint8Array como
 * ByteArray sin problema, pero al leer lo decodifica como utf-8 (con pérdida), así que
 * leemos los felts crudos y los volvemos bytes aquí:
 *   [data_len, ...data (bytes31 cada uno), pending_word, pending_word_len]
 */
export function decodeByteArrayFelts(felts: Array<string | bigint>): Uint8Array {
  if (felts.length < 3) return new Uint8Array(0);
  const dataLen = Number(BigInt(felts[0]));
  const parts: Uint8Array[] = [];
  for (let i = 0; i < dataLen; i++) parts.push(bigIntToBytes(BigInt(felts[1 + i]), 31));
  const pendingWord = BigInt(felts[1 + dataLen]);
  const pendingLen = Number(BigInt(felts[2 + dataLen]));
  if (pendingLen > 0) parts.push(bigIntToBytes(pendingWord, pendingLen));
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
