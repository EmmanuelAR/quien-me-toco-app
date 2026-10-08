import { NextResponse } from "next/server";
import { authFromRequest, verifyAdmin, AuthError } from "@/lib/server/auth";
import { kv, keys, ttlForEvent } from "@/lib/server/kv";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/groups/[id]/invite-code
 * Retrieves the invite code for a group (admin only)
 */
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const groupId = BigInt(id);

  try {
    const auth = authFromRequest(req);
    const group = await verifyAdmin(auth, "invite-code", groupId);

    const stored = await kv().get<string>(keys.inviteCode(groupId));
    if (!stored) {
      return NextResponse.json({ error: "No se encontró el código de invitación" }, { status: 404 });
    }

    return NextResponse.json({ inviteCode: stored, eventAt: group.eventAt });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * POST /api/groups/[id]/invite-code
 * Stores the invite code for a group (admin only, only once)
 */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const groupId = BigInt(id);

  try {
    const auth = authFromRequest(req);
    const group = await verifyAdmin(auth, "invite-code", groupId);

    const body = await req.json();
    const inviteCode = String(body.inviteCode);
    if (!inviteCode || inviteCode === "0") {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    const ttl = ttlForEvent(group.eventAt);
    const stored = await kv().set(keys.inviteCode(groupId), inviteCode, { ex: ttl, nx: true });

    if (!stored) {
      return NextResponse.json({ error: "El código ya existe" }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
