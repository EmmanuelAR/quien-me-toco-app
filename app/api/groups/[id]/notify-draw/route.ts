import { requireUser } from "@/lib/auth/server";
import { loadGroupAccess } from "@/lib/api/authz";
import { jsonError, jsonOk } from "@/lib/api/http";
import { notifyDrawEmails } from "@/lib/mail/notify-draw";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** reintentar correos del sorteo (best-effort) */
export async function POST(_req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const access = await loadGroupAccess(id, user.id);
    if (!access) return jsonError("not_found", 404);
    if (!access.isOwner) return jsonError("forbidden", 403);
    if (access.group.status !== "drawn" && access.group.status !== "revealed") {
      return jsonError("not_drawn", 409);
    }
    const emails = await notifyDrawEmails(id);
    return jsonOk({ emails });
  } catch (e) {
    if ((e as { status?: number }).status === 401) return jsonError("unauthorized", 401);
    console.error(e);
    return jsonError("error", 500);
  }
}
