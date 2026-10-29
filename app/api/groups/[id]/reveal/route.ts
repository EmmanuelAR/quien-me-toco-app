import { requireUser } from "@/lib/auth/server";
import { loadGroupAccess } from "@/lib/api/authz";
import { jsonError, jsonOk } from "@/lib/api/http";
import { listAssignments, listMembers, updateGroup } from "@/lib/db/groups";
import { formatDate } from "@/lib/format";
import { APP_TZ, canRevealNow } from "@/lib/time/reveal";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const access = await loadGroupAccess(id, user.id);
    if (!access) return jsonError("not_found", 404);
    if (!access.isOwner) return jsonError("forbidden", 403);
    if (access.group.status === "revealed") return jsonOk({ status: "revealed", already: true });
    if (access.group.status !== "drawn") return jsonError("not_drawn", 409);

    const eventAt = new Date(access.group.event_at);
    if (!canRevealNow(eventAt)) {
      const when = formatDate(Math.floor(eventAt.getTime() / 1000), { timeZone: APP_TZ });
      return jsonError(`Se habilita el ${when}.`, 403, { code: "too_early", when });
    }

    await updateGroup(id, { status: "revealed" });
    const [members, assignments] = await Promise.all([listMembers(id), listAssignments(id)]);
    const byId = new Map(members.map((m) => [m.id, m]));
    return jsonOk({
      status: "revealed",
      pairs: assignments.map((a) => ({
        giver: { id: a.giver_id, name: byId.get(a.giver_id)?.name ?? "?" },
        receiver: { id: a.receiver_id, name: byId.get(a.receiver_id)?.name ?? "?" },
      })),
    });
  } catch (e) {
    if ((e as { status?: number }).status === 401) return jsonError("unauthorized", 401);
    console.error(e);
    return jsonError("error", 500);
  }
}

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const access = await loadGroupAccess(id, user.id);
    if (!access) return jsonError("not_found", 404);
    if (access.group.status !== "revealed") return jsonError("not_revealed", 409);

    const [members, assignments] = await Promise.all([listMembers(id), listAssignments(id)]);
    const byId = new Map(members.map((m) => [m.id, m]));
    return jsonOk({
      status: "revealed",
      pairs: assignments.map((a) => ({
        giver: { id: a.giver_id, name: byId.get(a.giver_id)?.name ?? "?" },
        receiver: { id: a.receiver_id, name: byId.get(a.receiver_id)?.name ?? "?" },
      })),
    });
  } catch (e) {
    if ((e as { status?: number }).status === 401) return jsonError("unauthorized", 401);
    console.error(e);
    return jsonError("error", 500);
  }
}
