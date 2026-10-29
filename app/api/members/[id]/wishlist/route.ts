import { requireUser } from "@/lib/auth/server";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import { getGroup, getMember, updateWishlist } from "@/lib/db/groups";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
type Body = { ideas?: string; sizes?: string; links?: string };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const member = await getMember(id);
    if (!member) return jsonError("not_found", 404);
    const group = await getGroup(member.group_id);
    if (!group || group.archived) return jsonError("not_found", 404);
    const isOwner = group.owner_user_id === user.id;
    const isSelf = member.user_id === user.id;
    if (!isOwner && !isSelf) return jsonError("forbidden", 403);
    if (group.status === "revealed") return jsonError("locked", 409);

    const body = await readJson<Body>(req);
    const updated = await updateWishlist(id, {
      ideas: (body?.ideas ?? "").slice(0, 2000),
      sizes: (body?.sizes ?? "").slice(0, 500),
      links: (body?.links ?? "").slice(0, 2000),
    });
    return jsonOk({
      id: updated?.id,
      wishlist: {
        ideas: updated?.wishlist_ideas,
        sizes: updated?.wishlist_sizes,
        links: updated?.wishlist_links,
      },
    });
  } catch (e) {
    if ((e as { status?: number }).status === 401) return jsonError("unauthorized", 401);
    console.error(e);
    return jsonError("error", 500);
  }
}
