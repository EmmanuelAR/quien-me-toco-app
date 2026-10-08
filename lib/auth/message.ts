/**
 * "sign-in with cavos" para las rutas que solo la admin puede usar.
 * el cliente firma un mensaje corto con su llave de dispositivo (sin ui, sin gas) y el
 * servidor comprueba la firma y que esa llave sea un signer autorizado de la cuenta.
 * compartido entre cliente y servidor.
 */
export const AUTH_MAX_AGE_MS = 5 * 60 * 1000;

export type AdminAction = "ghost-links" | "emails" | "email-status" | "invite-code";

export interface AdminAuthPayload {
  address: string;
  message: string;
  /** firma r||s (64 bytes) en hex */
  signature: string;
  /** llave pública sin comprimir 04||x||y en hex */
  publicKey: string;
}

export function buildAuthMessage(action: AdminAction, groupId: bigint, issuedAt = Date.now()): string {
  return `qmt:v1:${action}:${groupId.toString()}:${issuedAt}`;
}

export function parseAuthMessage(message: string): { action: string; groupId: bigint; issuedAt: number } | null {
  const m = /^qmt:v1:([a-z-]+):(\d+):(\d+)$/.exec(message);
  if (!m) return null;
  return { action: m[1], groupId: BigInt(m[2]), issuedAt: Number(m[3]) };
}

/** mismo prefijo que usa cavos: "Cavos Signed Message:\n<len>\n<mensaje>" */
export function prefixedMessageBytes(message: string): Uint8Array {
  const enc = new TextEncoder();
  const body = enc.encode(message);
  const prefix = enc.encode(`Cavos Signed Message:\n${body.length}\n`);
  const out = new Uint8Array(prefix.length + body.length);
  out.set(prefix, 0);
  out.set(body, prefix.length);
  return out;
}
