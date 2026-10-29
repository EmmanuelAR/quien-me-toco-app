import { requireUser } from "@/lib/auth/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { listMembers, listMyGroups } from "@/lib/db/groups";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const groups = await listMyGroups(user.id);
    const withCounts = await Promise.all(
      groups.map(async (g) => {
        const members = await listMembers(g.id);
        return {
          id: g.id,
          name: g.name,
          eventAt: Math.floor(new Date(g.event_at).getTime() / 1000),
          place: g.place,
          status: g.status,
          role: g.role,
          archived: g.archived,
          inviteToken: g.invite_token,
          participantCount: members.length,
        };
      }),
    );
    return jsonOk({ groups: withCounts });
  } catch (e) {
    if ((e as { status?: number }).status === 401) return jsonError("unauthorized", 401);
    console.error(e);
    return jsonError("error", 500);
  }
}
