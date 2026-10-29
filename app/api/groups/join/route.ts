import { requireUser } from "@/lib/auth/server";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import {
  OPEN_JOIN_CAP,
  addMember,
  findMemberByUser,
  getGroupByInvite,
  listMembers,
} from "@/lib/db/groups";

export const dynamic = "force-dynamic";

type Body = { token?: string; name?: string };

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await readJson<Body>(req);
    const token = body?.token?.trim();
    if (!token) return jsonError("falta invite", 400);

    const group = await getGroupByInvite(token);
    if (!group || group.archived) return jsonError("invitación inválida", 404);
    if (group.status !== "open") return jsonError("el grupo ya no acepta gente", 409);

    const existing = await findMemberByUser(group.id, user.id);
    if (existing) return jsonOk({ groupId: group.id, memberId: existing.id, already: true });

    const members = await listMembers(group.id);
    if (members.length >= OPEN_JOIN_CAP) return jsonError("cupo lleno", 409);

    const name = (body?.name?.trim() || user.name).slice(0, 80);
    const member = await addMember({
      groupId: group.id,
      userId: user.id,
      name,
      email: user.email || null,
    });
    return jsonOk({ groupId: group.id, memberId: member.id, already: false }, { status: 201 });
  } catch (e) {
    if ((e as { status?: number }).status === 401) return jsonError("unauthorized", 401);
    console.error(e);
    return jsonError("error", 500);
  }
}
