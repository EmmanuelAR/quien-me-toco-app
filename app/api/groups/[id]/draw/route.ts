import { requireUser } from "@/lib/auth/server";
import { loadGroupAccess } from "@/lib/api/authz";
import { jsonError, jsonOk } from "@/lib/api/http";
import { listMembers, runDraw } from "@/lib/db/groups";
import { MIN_PARTICIPANTS } from "@/lib/draw/assign";
import { notifyDrawEmails } from "@/lib/mail/notify-draw";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const access = await loadGroupAccess(id, user.id);
    if (!access) return jsonError("not_found", 404);
    if (!access.isOwner) return jsonError("forbidden", 403);

    const members = await listMembers(id);
    if (members.length < MIN_PARTICIPANTS) {
      return jsonError(`necesitás al menos ${MIN_PARTICIPANTS} personas`, 400, { code: "too_few" });
    }

    const result = await runDraw(id);
    if (!result.ok) {
      const status = result.error === "infeasible" ? 422 : result.error === "locked" ? 409 : 400;
      return jsonError(result.error, status, { code: result.error });
    }

    // el sorteo ya quedó; los correos son best-effort
    const emails = await notifyDrawEmails(id);
    return jsonOk({ ok: true, status: "drawn", emails });
  } catch (e) {
    if ((e as { status?: number }).status === 401) return jsonError("unauthorized", 401);
    console.error(e);
    return jsonError("error", 500);
  }
}
