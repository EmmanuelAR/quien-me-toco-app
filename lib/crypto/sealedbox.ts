import { x25519 } from "@noble/curves/ed25519.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { concatBytes, randomBytes } from "./random";

/**
 * "sobre sellado" para un destinatario x25519.
 * formato: 0x01 || ephPub(32) || nonce(24) || xchacha20poly1305(plaintext)
 * clave = hkdf-sha256(x25519(eph, pub), salt = ephPub || pub, info = "qmt-v1")
 * `aad` ata el sobre a su casilla (grupo + índice) para que nadie los intercambie.
 */
const VERSION = 0x01;
const INFO = new TextEncoder().encode("qmt-v1");
const PUB_LEN = 32;
const NONCE_LEN = 24;
const TAG_LEN = 16;

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export function generateKeyPair(): KeyPair {
  const secretKey = x25519.utils.randomSecretKey();
  return { secretKey, publicKey: x25519.getPublicKey(secretKey) };
}

export function publicKeyOf(secretKey: Uint8Array): Uint8Array {
  return x25519.getPublicKey(secretKey);
}

function deriveKey(shared: Uint8Array, ephPub: Uint8Array, recipientPub: Uint8Array): Uint8Array {
  return hkdf(sha256, shared, concatBytes(ephPub, recipientPub), INFO, 32);
}

export function seal(recipientPub: Uint8Array, plaintext: Uint8Array, aad: Uint8Array): Uint8Array {
  if (recipientPub.length !== PUB_LEN) throw new Error("sealedbox: pubkey inválida");
  const eph = generateKeyPair();
  const shared = x25519.getSharedSecret(eph.secretKey, recipientPub);
  const key = deriveKey(shared, eph.publicKey, recipientPub);
  const nonce = randomBytes(NONCE_LEN);
  const ct = xchacha20poly1305(key, nonce, aad).encrypt(plaintext);
  return concatBytes(new Uint8Array([VERSION]), eph.publicKey, nonce, ct);
}

export function open(secretKey: Uint8Array, box: Uint8Array, aad: Uint8Array): Uint8Array {
  if (box.length < 1 + PUB_LEN + NONCE_LEN + TAG_LEN) throw new Error("sealedbox: sobre muy corto");
  if (box[0] !== VERSION) throw new Error("sealedbox: versión desconocida");
  const ephPub = box.subarray(1, 1 + PUB_LEN);
  const nonce = box.subarray(1 + PUB_LEN, 1 + PUB_LEN + NONCE_LEN);
  const ct = box.subarray(1 + PUB_LEN + NONCE_LEN);
  const recipientPub = x25519.getPublicKey(secretKey);
  const shared = x25519.getSharedSecret(secretKey, ephPub);
  const key = deriveKey(shared, ephPub, recipientPub);
  return xchacha20poly1305(key, nonce, aad).decrypt(ct);
}

/** aad de la casilla de un participante */
export function slotAad(groupId: bigint, index: number): Uint8Array {
  return new TextEncoder().encode(`qmt:${groupId.toString()}:${index}`);
}

/** aad del paquete de revelación (todo el sorteo, sellado para el servidor) */
export function revealAad(groupId: bigint): Uint8Array {
  return new TextEncoder().encode(`qmt:${groupId.toString()}:reveal`);
}
