import { hash } from "starknet";
import { bigIntToBytes, bytesToBigInt, concatBytes, randomBytes } from "./random";

/**
 * sellos del sorteo.
 * commitment_i = poseidon(group_id, i, receiver_i, salt_i)
 * mismo cálculo que `poseidon_hash_span` en el contrato (contracts/src/quien_me_toco.cairo).
 */

/** salt aleatorio que cabe en un felt252 (31 bytes < 2^248 < p) */
export function randomSalt(): bigint {
  return bytesToBigInt(randomBytes(31));
}

export function commitment(groupId: bigint, index: number, receiver: number, salt: bigint): bigint {
  const h = hash.computePoseidonHashOnElements([groupId, BigInt(index), BigInt(receiver), salt]);
  return BigInt(h);
}

export function verifyCommitment(
  groupId: bigint,
  index: number,
  receiver: number,
  salt: bigint,
  expected: bigint,
): boolean {
  return commitment(groupId, index, receiver, salt) === expected;
}

/** papelito de quien regala: receiver (2 bytes) || salt (32 bytes) */
export interface Slip {
  receiver: number;
  salt: bigint;
}

export function encodeSlip(slip: Slip): Uint8Array {
  const r = new Uint8Array([(slip.receiver >> 8) & 0xff, slip.receiver & 0xff]);
  return concatBytes(r, bigIntToBytes(slip.salt, 32));
}

export function decodeSlip(bytes: Uint8Array): Slip {
  if (bytes.length !== 34) throw new Error("slip: largo inválido");
  const receiver = (bytes[0] << 8) | bytes[1];
  return { receiver, salt: bytesToBigInt(bytes.subarray(2)) };
}

/** paquete de revelación: n (2 bytes) || receivers (2 bytes c/u) || salts (32 bytes c/u) */
export interface RevealPackage {
  receivers: number[];
  salts: bigint[];
}

export function encodeRevealPackage(pkg: RevealPackage): Uint8Array {
  const n = pkg.receivers.length;
  if (pkg.salts.length !== n) throw new Error("reveal: largos distintos");
  const parts: Uint8Array[] = [new Uint8Array([(n >> 8) & 0xff, n & 0xff])];
  for (const r of pkg.receivers) parts.push(new Uint8Array([(r >> 8) & 0xff, r & 0xff]));
  for (const s of pkg.salts) parts.push(bigIntToBytes(s, 32));
  return concatBytes(...parts);
}

export function decodeRevealPackage(bytes: Uint8Array): RevealPackage {
  const n = (bytes[0] << 8) | bytes[1];
  if (bytes.length !== 2 + n * 2 + n * 32) throw new Error("reveal: largo inválido");
  const receivers: number[] = [];
  const salts: bigint[] = [];
  let o = 2;
  for (let i = 0; i < n; i++, o += 2) receivers.push((bytes[o] << 8) | bytes[o + 1]);
  for (let i = 0; i < n; i++, o += 32) salts.push(bytesToBigInt(bytes.subarray(o, o + 32)));
  return { receivers, salts };
}
