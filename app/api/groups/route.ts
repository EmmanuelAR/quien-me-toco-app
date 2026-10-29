import { requireUser } from "@/lib/auth/server";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import { createGroup } from "@/lib/db/groups";

export const dynamic = "force-dynamic";

type Body = {
  name?: string;
  eventAt?: string;
  place?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  rules?: string;
};

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await readJson<Body>(req);
    if (!body?.name?.trim() || !body.eventAt) return jsonError("datos incompletos", 400);
    const eventAt = new Date(body.eventAt);
    if (Number.isNaN(eventAt.getTime())) return jsonError("fecha inválida", 400);
    const budgetMin = Math.max(0, Number(body.budgetMin ?? 0));
    const budgetMax = Math.max(budgetMin, Number(body.budgetMax ?? budgetMin));
    const group = await createGroup({
      name: body.name.trim().slice(0, 120),
      eventAt,
      place: (body.place ?? "").trim().slice(0, 200),
      budgetMin,
      budgetMax,
      currency: (body.currency ?? "CRC").trim().slice(0, 8) || "CRC",
      rules: (body.rules ?? "").trim().slice(0, 2000),
      ownerUserId: user.id,
      ownerName: user.name,
      ownerEmail: user.email || null,
    });
    return jsonOk({
      id: group.id,
      inviteToken: group.invite_token,
      status: group.status,
    }, { status: 201 });
  } catch (e) {
    if ((e as { status?: number }).status === 401) return jsonError("unauthorized", 401);
    console.error(e);
    return jsonError("error", 500);
  }
}
