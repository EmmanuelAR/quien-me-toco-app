import { requireUser } from "@/lib/auth/server";
import { loadGroupAccess } from "@/lib/api/authz";
import { jsonError, jsonOk } from "@/lib/api/http";
import { getAssignmentForGiver, getMember } from "@/lib/db/groups";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const access = await loadGroupAccess(id, user.id);
    if (!access) return jsonError("not_found", 404);
    if (access.group.status !== "drawn" && access.group.status !== "revealed") {
      return jsonError("not_drawn", 409);
    }
    if (!access.member) return jsonError("not_a_member", 403);

    const assignment = await getAssignmentForGiver(id, access.member.id);
    if (!assignment) return jsonError("missing", 404);
    const receiver = await getMember(assignment.receiver_id);
    if (!receiver) return jsonError("missing", 404);

    return jsonOk({
      receiver: {
        id: receiver.id,
        name: receiver.name,
        wishlist: {
          ideas: receiver.wishlist_ideas,
          sizes: receiver.wishlist_sizes,
          links: receiver.wishlist_links,
        },
      },
      revealed: access.group.status === "revealed",
    });
  } catch (e) {
    if ((e as { status?: number }).status === 401) return jsonError("unauthorized", 401);
    console.error(e);
    return jsonError("error", 500);
  }
}
