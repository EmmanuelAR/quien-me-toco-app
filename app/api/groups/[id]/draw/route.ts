import { runDraw } from "@/lib/server/draw";
import { sendDrawEmails } from "@/lib/server/emails";
import { handleError, json, parseGroupId } from "@/lib/server/http";

export const maxDuration = 120;

/**
 * worker del sorteo. no necesita login: solo actúa si el contrato está en DrawRequested,
 * y eso solo lo pone la admin con su wallet.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const groupId = parseGroupId(id);
    if (!groupId) return json({ error: "grupo inválido" }, 400);

    const result = await runDraw(groupId);
    if (!result.ok) {
      if (result.reason === "infeasible") {
        return json({ error: "infeasible", message: "con estas reglas no sale el sorteo, quitá alguna exclusión" }, 422);
      }
      return json({ error: "wrong-status", status: result.status }, 409);
    }

    // los correos salen después de que la cadena aceptó el sorteo; si algo falla aquí,
    // la admin lo ve en "correos enviados" y puede reintentar.
    let emails = null;
    try {
      emails = await sendDrawEmails(groupId);
    } catch (e) {
      console.error("[draw] correos", e);
    }
    return json({ ok: true, already: result.already, txHash: result.txHash, emails });
  } catch (e) {
    return handleError(e);
  }
}
