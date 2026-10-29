import { requireUser } from "@/lib/auth/server";
import { loadGroupAccess } from "@/lib/api/authz";
import { jsonError, jsonOk } from "@/lib/api/http";
import { listAssignments, listMembers, updateGroup } from "@/lib/db/groups";

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

    await updateGroup(id, { status: "revealed" });
    const [members, assignments] = await Promise.all([
      listMembers(id),
      listAssignments(id),
    ]);
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

    const [members, assignments] = await Promise.all([
      listMembers(id),
      listAssignments(id),
    ]);
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
