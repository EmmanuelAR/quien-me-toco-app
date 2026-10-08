import "server-only";
import { num } from "starknet";
import { getProvider } from "@/lib/contract/client";
import { readGroup } from "@/lib/contract/reads";
import { AUTH_MAX_AGE_MS, type AdminAction, type AdminAuthPayload } from "@/lib/auth/message";
import { normalizeAddress, pubkeyCalldata, verifySignedMessage } from "@/lib/auth/verify";
import type { Group } from "@/lib/contract/types";
import { kv } from "./kv";

export class AuthError extends Error {
  constructor(
    message: string,
    public status = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** ¿esta llave p-256 es un signer autorizado de la cuenta cavos? (lectura on-chain) */
async function isAuthorizedSigner(account: string, publicKey: Uint8Array): Promise<boolean> {
  const calldata = pubkeyCalldata(publicKey).map((v) => num.toHex(v));
  try {
    const res = await getProvider().callContract({ contractAddress: account, entrypoint: "is_authorized_signer", calldata });
    return BigInt(res[0] ?? 0) !== 0n;
  } catch {
    return false;
  }
}

const signatureKey = (sig: string) => `auth:sig:${sig.slice(0, 32)}`;

/**
 * verifica el payload firmado con cavos y devuelve el grupo si quien firma es la admin.
 * lanza AuthError si no.
 */
export async function verifyAdmin(payload: Partial<AdminAuthPayload> | null, action: AdminAction, groupId: bigint): Promise<Group> {
  const outcome = verifySignedMessage(payload, action, groupId);
  if (!outcome.ok) throw new AuthError(outcome.error);

  if (payload?.signature) {
    const key = signatureKey(payload.signature);
    const alreadyUsed = await kv().get<boolean>(key);
    if (alreadyUsed) throw new AuthError("Esta firma ya fue usada. Intentá de nuevo.");
    const ttlSec = Math.ceil(AUTH_MAX_AGE_MS / 1000) + 10;
    await kv().set(key, true, { ex: ttlSec });
  }

  if (!(await isAuthorizedSigner(outcome.address, outcome.publicKey))) throw new AuthError("Esta llave no está autorizada.");
  const group = await readGroup(groupId);
  if (normalizeAddress(group.admin) !== outcome.address) throw new AuthError("Este panel es solo para quien organiza.", 403);
  return group;
}

export function authFromRequest(req: Request): Partial<AdminAuthPayload> | null {
  const header = req.headers.get("x-qmt-auth");
  if (!header) return null;
  try {
    return JSON.parse(Buffer.from(header, "base64").toString("utf8")) as AdminAuthPayload;
  } catch {
    return null;
  }
}
