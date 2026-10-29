import { requireUser } from "@/lib/auth/server";
import { loadGroupAccess } from "@/lib/api/authz";
import { jsonError, jsonOk } from "@/lib/api/http";
import { testToolsEnabled } from "@/lib/app/test-tools";
import { addTestMembers } from "@/lib/db/groups";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  if (!testToolsEnabled()) return jsonError("not_found", 404);

  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const access = await loadGroupAccess(id, user.id);
    if (!access) return jsonError("not_found", 404);
    if (!access.isOwner) return jsonError("forbidden", 403);

    const { group } = access;
    if (group.archived) return jsonError("archived", 409);
    if (group.status !== "open" && group.status !== "closed") {
      return jsonError("locked", 409);
    }

    const result = await addTestMembers(id, 2);
    if (result.added.length === 0) {
      return jsonError("no se pudieron agregar más personas de prueba", 409, { code: "none_added" });
    }

    return jsonOk(
      {
        added: result.added.map((m) => ({ id: m.id, name: m.name })),
        total: result.total,
      },
      { status: 201 },
    );
  } catch (e) {
    if ((e as { status?: number }).status === 401) return jsonError("unauthorized", 401);
    console.error(e);
    return jsonError("error", 500);
  }
}
