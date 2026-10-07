import { readParticipants } from "@/lib/contract/reads";
import { authFromRequest, verifyAdmin } from "@/lib/server/auth";
import { emailSummary, sendDrawEmails } from "@/lib/server/emails";
import { handleError, json, parseGroupId } from "@/lib/server/http";

export const maxDuration = 120;

/** GET: estado "correos enviados: 8/8" (solo la admin) */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const groupId = parseGroupId(id);
    if (!groupId) return json({ error: "Grupo inválido." }, 400);
    const group = await verifyAdmin(authFromRequest(req), "email-status", groupId);
    const participants = await readParticipants(groupId);
    return json(await emailSummary(group, participants));
  } catch (e) {
    return handleError(e);
  }
}

/** POST: reintentar los que faltan (solo la admin) */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const groupId = parseGroupId(id);
    if (!groupId) return json({ error: "Grupo inválido." }, 400);
    await verifyAdmin(authFromRequest(req), "emails", groupId);
    return json(await sendDrawEmails(groupId));
  } catch (e) {
    return handleError(e);
  }
}
