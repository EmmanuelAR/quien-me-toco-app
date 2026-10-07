import { authFromRequest, verifyAdmin } from "@/lib/server/auth";
import { ghostLinks } from "@/lib/server/ghost";
import { handleError, json, parseGroupId } from "@/lib/server/http";

/** links privados de los participantes sin cuenta (solo la admin; no incluyen el resultado) */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const groupId = parseGroupId(id);
    if (!groupId) return json({ error: "Grupo inválido." }, 400);
    await verifyAdmin(authFromRequest(req), "ghost-links", groupId);
    return json({ links: await ghostLinks(groupId) });
  } catch (e) {
    return handleError(e);
  }
}
