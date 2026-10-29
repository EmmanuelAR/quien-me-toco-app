import { cookies } from "next/headers";
import { jsonError, jsonOk, readJson } from "@/lib/api/http";
import {
  QA_PERSONA_COOKIE,
  parseQaPersona,
  qaAuthBypassServerEnabled,
  qaUserForPersona,
  type QaPersona,
} from "@/lib/auth/qa";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!qaAuthBypassServerEnabled()) return jsonError("not_found", 404);
  const jar = await cookies();
  const persona = parseQaPersona(jar.get(QA_PERSONA_COOKIE)?.value);
  const user = qaUserForPersona(persona);
  return jsonOk({ persona, user, bypass: true });
}

export async function POST(req: Request) {
  if (!qaAuthBypassServerEnabled()) return jsonError("not_found", 404);
  const body = await readJson<{ persona?: string }>(req);
  const persona = parseQaPersona(body?.persona) satisfies QaPersona;
  const jar = await cookies();
  jar.set(QA_PERSONA_COOKIE, persona, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
  return jsonOk({ persona, user: qaUserForPersona(persona) });
}
