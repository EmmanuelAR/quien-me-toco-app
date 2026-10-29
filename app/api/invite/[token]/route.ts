import { jsonError, jsonOk } from "@/lib/api/http";
import { getGroupByInvite, listMembers } from "@/lib/db/groups";
import { getOptionalUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params;
    const group = await getGroupByInvite(token);
    if (!group || group.archived) return jsonError("not_found", 404);
    const members = await listMembers(group.id);
    const user = await getOptionalUser();
    return jsonOk({
      id: group.id,
      name: group.name,
      eventAt: Math.floor(new Date(group.event_at).getTime() / 1000),
      place: group.place,
      status: group.status,
      participantCount: members.length,
      open: group.status === "open",
      signedIn: Boolean(user),
      alreadyMember: user
        ? members.some((m) => m.user_id === user.id)
        : false,
    });
  } catch (e) {
    console.error(e);
    return jsonError("error", 500);
  }
}
