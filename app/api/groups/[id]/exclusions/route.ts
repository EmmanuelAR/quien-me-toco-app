import { requireUser } from "@/lib/auth/server";
import { loadGroupAccess } from "@/lib/api/authz";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import { listExclusions, listMembers, setExclusions } from "@/lib/db/groups";
import { isFeasible } from "@/lib/draw/assign";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
type Body = { pairs?: Array<{ aId: string; bId: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const access = await loadGroupAccess(id, user.id);
    if (!access) return jsonError("not_found", 404);
    if (!access.isOwner) return jsonError("forbidden", 403);
    if (access.group.status === "drawn" || access.group.status === "revealed") {
      return jsonError("locked", 409);
    }

    const body = await readJson<Body>(req);
    const pairs = body?.pairs ?? [];
    const members = await listMembers(id);
    const ids = new Set(members.map((m) => m.id));
    for (const p of pairs) {
      if (!ids.has(p.aId) || !ids.has(p.bId) || p.aId === p.bId) {
        return jsonError("par inválido", 400);
      }
    }

    const indexById = new Map(members.map((m, i) => [m.id, i]));
    const drawPairs: Array<[number, number]> = pairs.map((p) => [
      indexById.get(p.aId)!,
      indexById.get(p.bId)!,
    ]);
    if (members.length >= 3 && !isFeasible({ n: members.length, pairs: drawPairs })) {
      return jsonError("con estas exclusiones el sorteo no es posible", 422, { code: "infeasible" });
    }

    await setExclusions(id, pairs);
    const saved = await listExclusions(id);
    return jsonOk({ exclusions: saved.map((e) => ({ aId: e.a_id, bId: e.b_id })) });
  } catch (e) {
    if ((e as { status?: number }).status === 401) return jsonError("unauthorized", 401);
    console.error(e);
    return jsonError("error", 500);
  }
}
