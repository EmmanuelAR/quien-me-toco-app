import { sha256 } from "@noble/hashes/sha2.js";
import { bytesEqual, concatBytes, randomBytes, toBase64Url } from "./random";

/**
 * el correo no va a la cadena. va al kv con un nonce, y en la cadena queda
 * sha256(correo_normalizado || ":" || nonce). así el servidor puede comprobar que
 * el correo que le mandaron es el de ese participante, y nadie puede adivinarlo
 * desde la cadena (el nonce es aleatorio).
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email));
}

export function newEmailNonce(): string {
  return toBase64Url(randomBytes(16));
}

export function emailCommit(email: string, nonce: string): Uint8Array {
  const enc = new TextEncoder();
  return sha256(concatBytes(enc.encode(normalizeEmail(email)), enc.encode(":"), enc.encode(nonce)));
}

export function verifyEmailCommit(email: string, nonce: string, expected: Uint8Array): boolean {
  return bytesEqual(emailCommit(email, nonce), expected);
}
