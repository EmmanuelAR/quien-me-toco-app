import { runReveal } from "@/lib/server/reveal";
import { handleError, json, parseGroupId } from "@/lib/server/http";

export const maxDuration = 120;

/** worker de la revelación: solo actúa si el contrato está en RevealRequested (lo pone la admin) */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const groupId = parseGroupId(id);
    if (!groupId) return json({ error: "grupo inválido" }, 400);
    const result = await runReveal(groupId);
    if (!result.ok) return json({ error: "wrong-status", status: result.status }, 409);
    return json({ ok: true, already: result.already, txHash: result.txHash });
  } catch (e) {
    return handleError(e);
  }
}
