import { runReencrypt } from "@/lib/server/reveal";
import { handleError, json, parseGroupId, readJson } from "@/lib/server/http";

export const maxDuration = 120;

/**
 * re-cifra el papelito de un participante que rotó su llave. no necesita login: solo
 * actúa si la cadena dice que la llave es más nueva que el cifrado (y eso solo lo
 * puede causar el propio participante con su wallet).
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const groupId = parseGroupId(id);
    if (!groupId) return json({ error: "grupo inválido" }, 400);
    const body = await readJson<{ index?: number }>(req);
    const index = Number(body?.index);
    if (!Number.isInteger(index) || index < 0) return json({ error: "índice inválido" }, 400);
    const result = await runReencrypt(groupId, index);
    if (!result.ok) return json({ error: result.reason }, result.reason === "up-to-date" ? 200 : 409);
    return json({ ok: true, txHash: result.txHash });
  } catch (e) {
    return handleError(e);
  }
}
