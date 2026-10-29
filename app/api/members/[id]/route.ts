import { requireUser } from "@/lib/auth/server";
import { loadGroupAccess } from "@/lib/api/authz";
import { jsonError, jsonOk } from "@/lib/api/http";
import { getMember, removeMember } from "@/lib/db/groups";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** quitar participante (solo owner, pre-sorteo; no al dueño del grupo) */
export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const member = await getMember(id);
    if (!member) return jsonError("not_found", 404);

    const access = await loadGroupAccess(member.group_id, user.id);
    if (!access) return jsonError("not_found", 404);
    if (!access.isOwner) return jsonError("forbidden", 403);
    if (access.group.status !== "open" && access.group.status !== "closed") {
      return jsonError("locked", 409);
    }
    if (member.user_id && member.user_id === access.group.owner_user_id) {
      return jsonError("no podés quitarte como organizador", 400, { code: "owner" });
    }

    await removeMember(id);
    return jsonOk({ ok: true });
  } catch (e) {
    if ((e as { status?: number }).status === 401) return jsonError("unauthorized", 401);
    console.error(e);
    return jsonError("error", 500);
  }
}
