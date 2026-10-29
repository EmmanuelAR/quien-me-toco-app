import { requireUser } from "@/lib/auth/server";
import { loadGroupAccess } from "@/lib/api/authz";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import { testToolsEnabled } from "@/lib/app/test-tools";
import { listExclusions, listMembers, updateGroup } from "@/lib/db/groups";
import type { GroupStatus } from "@/lib/db/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function serializeGroup(
  access: NonNullable<Awaited<ReturnType<typeof loadGroupAccess>>>,
  members: Awaited<ReturnType<typeof listMembers>>,
  exclusions: Awaited<ReturnType<typeof listExclusions>>,
) {
  const { group, member, isOwner } = access;
  const drawn = group.status === "drawn" || group.status === "revealed";
  return {
    id: group.id,
    name: group.name,
    eventAt: Math.floor(new Date(group.event_at).getTime() / 1000),
    place: group.place,
    budgetMin: group.budget_min,
    budgetMax: group.budget_max,
    currency: group.currency,
    rules: group.rules,
    status: group.status,
    archived: group.archived,
    inviteToken: isOwner ? group.invite_token : undefined,
    isOwner,
    myMemberId: member?.id ?? null,
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      email: isOwner ? m.email : undefined,
      userId: m.user_id,
      wishlist: {
        ideas: m.wishlist_ideas,
        sizes: m.wishlist_sizes,
        links: m.wishlist_links,
      },
      // wishlist de otros solo visible post-sorteo para el que te tocó; listado admin ve todos
      wishlistVisible: isOwner || m.id === member?.id || drawn,
    })),
    exclusions: exclusions.map((e) => ({ aId: e.a_id, bId: e.b_id })),
    participantCount: members.length,
    testTools: isOwner && testToolsEnabled(),
  };
}

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const access = await loadGroupAccess(id, user.id);
    if (!access) return jsonError("not_found", 404);
    const [members, exclusions] = await Promise.all([
      listMembers(id),
      listExclusions(id),
    ]);
    return jsonOk({ group: serializeGroup(access, members, exclusions) });
  } catch (e) {
    if ((e as { status?: number }).status === 401) return jsonError("unauthorized", 401);
    console.error(e);
    return jsonError("error", 500);
  }
}

type PatchBody = {
  name?: string;
  eventAt?: string;
  place?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  rules?: string;
  status?: GroupStatus;
  archived?: boolean;
};

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const access = await loadGroupAccess(id, user.id);
    if (!access) return jsonError("not_found", 404);
    if (!access.isOwner) return jsonError("forbidden", 403);
    if (access.group.status === "drawn" || access.group.status === "revealed") {
      const body = await readJson<PatchBody>(req);
      // post-draw solo archived / reveal via otra ruta
      if (body?.archived !== undefined) {
        const updated = await updateGroup(id, { archived: body.archived });
        return jsonOk({ id: updated?.id, archived: updated?.archived });
      }
      return jsonError("locked", 409);
    }
    const body = await readJson<PatchBody>(req);
    if (!body) return jsonError("body inválido", 400);
    const updated = await updateGroup(id, {
      name: body.name,
      eventAt: body.eventAt ? new Date(body.eventAt) : undefined,
      place: body.place,
      budgetMin: body.budgetMin,
      budgetMax: body.budgetMax,
      currency: body.currency,
      rules: body.rules,
      status: body.status === "closed" || body.status === "open" ? body.status : undefined,
      archived: body.archived,
    });
    return jsonOk({ id: updated?.id, status: updated?.status });
  } catch (e) {
    if ((e as { status?: number }).status === 401) return jsonError("unauthorized", 401);
    console.error(e);
    return jsonError("error", 500);
  }
}
