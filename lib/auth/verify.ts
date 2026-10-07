import { p256 } from "@noble/curves/nist.js";
import { hexToBytes } from "@/lib/crypto/random";
import { AUTH_MAX_AGE_MS, parseAuthMessage, prefixedMessageBytes, type AdminAction, type AdminAuthPayload } from "./message";

export type VerifyOutcome =
  | { ok: true; address: string; publicKey: Uint8Array }
  | { ok: false; error: string };

export function normalizeAddress(addr: string): string {
  return "0x" + BigInt(addr).toString(16).padStart(64, "0");
}

/**
 * parte pura de la verificación: mensaje bien formado, fresco, y firma p-256 válida
 * sobre el mensaje con el prefijo de cavos. que la llave sea de la cuenta se comprueba
 * aparte, en la cadena (lib/server/auth.ts).
 */
export function verifySignedMessage(
  payload: Partial<AdminAuthPayload> | null,
  action: AdminAction,
  groupId: bigint,
  now = Date.now(),
): VerifyOutcome {
  if (!payload?.address || !payload.message || !payload.signature || !payload.publicKey) {
    return { ok: false, error: "Falta la firma." };
  }
  const parsed = parseAuthMessage(payload.message);
  if (!parsed || parsed.action !== action || parsed.groupId !== groupId) return { ok: false, error: "Mensaje inválido." };
  if (Math.abs(now - parsed.issuedAt) > AUTH_MAX_AGE_MS) return { ok: false, error: "La firma venció. Probá de nuevo." };

  let signature: Uint8Array;
  let publicKey: Uint8Array;
  let address: string;
  try {
    signature = hexToBytes(payload.signature);
    publicKey = hexToBytes(payload.publicKey);
    address = normalizeAddress(payload.address);
  } catch {
    return { ok: false, error: "Firma mal formada." };
  }
  if (publicKey.length !== 65 || publicKey[0] !== 0x04 || signature.length !== 64) {
    return { ok: false, error: "Firma mal formada." };
  }
  let valid = false;
  try {
    valid = p256.verify(signature, prefixedMessageBytes(payload.message), publicKey, { prehash: true, lowS: false });
  } catch {
    valid = false;
  }
  if (!valid) return { ok: false, error: "Firma inválida." };
  return { ok: true, address, publicKey };
}

/** calldata [x_low, x_high, y_low, y_high] de una llave p-256 sin comprimir */
export function pubkeyCalldata(publicKey: Uint8Array): bigint[] {
  const hex = (b: Uint8Array) => BigInt("0x" + Array.from(b, (v) => v.toString(16).padStart(2, "0")).join(""));
  const x = hex(publicKey.subarray(1, 33));
  const y = hex(publicKey.subarray(33, 65));
  const mask = (1n << 128n) - 1n;
  return [x & mask, x >> 128n, y & mask, y >> 128n];
}
