import { readGroup } from "@/lib/contract/reads";
import { GroupStatus } from "@/lib/contract/types";
import { isValidEmail, normalizeEmail } from "@/lib/crypto/email";
import { storeEmail } from "@/lib/server/emails";
import { handleError, json, parseGroupId, readJson } from "@/lib/server/http";

interface Body {
  groupId?: string;
  account?: string;
  email?: string;
  nonce?: string;
}

/**
 * guarda el correo (fuera de la cadena) junto con su nonce. al mandar los correos, el
 * servidor comprueba que sha256(correo || ":" || nonce) coincida con el email_commit que
 * el participante dejó en la cadena con su propia wallet, así nadie puede colarle un
 * correo ajeno a otra persona.
 */
export async function POST(req: Request) {
  try {
    const body = await readJson<Body>(req);
    const groupId = body?.groupId ? parseGroupId(body.groupId) : null;
    const account = body?.account ?? "";
    const email = normalizeEmail(body?.email ?? "");
    const nonce = body?.nonce ?? "";
    if (!groupId || !/^0x[0-9a-fA-F]{1,64}$/.test(account) || !isValidEmail(email) || !/^[A-Za-z0-9_-]{8,64}$/.test(nonce)) {
      return json({ error: "datos inválidos" }, 400);
    }
    const group = await readGroup(groupId);
    if (group.status === GroupStatus.Revealed) return json({ error: "ya se reveló" }, 409);
    await storeEmail(group, account, email, nonce);
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
