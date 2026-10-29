import "server-only";
import { cookies } from "next/headers";
import { createNeonAuth } from "@neondatabase/auth/next/server";
import {
  QA_PERSONA_COOKIE,
  parseQaPersona,
  qaAuthBypassServerEnabled,
  qaUserForPersona,
} from "@/lib/auth/qa";

function authConfig() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret) {
    throw new Error("faltan NEON_AUTH_BASE_URL o NEON_AUTH_COOKIE_SECRET");
  }
  if (secret.length < 32) {
    throw new Error("NEON_AUTH_COOKIE_SECRET debe tener al menos 32 caracteres");
  }
  return {
    baseUrl,
    cookies: { secret },
  } as const;
}

export const auth = createNeonAuth(authConfig());

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

async function qaBypassUser(): Promise<SessionUser | null> {
  if (!qaAuthBypassServerEnabled()) return null;
  const jar = await cookies();
  const persona = parseQaPersona(jar.get(QA_PERSONA_COOKIE)?.value);
  return qaUserForPersona(persona);
}

export async function requireUser(): Promise<SessionUser> {
  const bypass = await qaBypassUser();
  if (bypass) return bypass;

  const { data: session } = await auth.getSession();
  const user = session?.user;
  if (!user?.id) {
    const err = new Error("unauthorized");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  return {
    id: user.id,
    name: user.name ?? user.email ?? "Participante",
    email: user.email ?? "",
    image: user.image,
  };
}

export async function getOptionalUser(): Promise<SessionUser | null> {
  const bypass = await qaBypassUser();
  if (bypass) return bypass;
  // persona "off" with bypass still means logged out for optional checks
  if (qaAuthBypassServerEnabled()) return null;

  try {
    const { data: session } = await auth.getSession();
    const user = session?.user;
    if (!user?.id) return null;
    return {
      id: user.id,
      name: user.name ?? user.email ?? "Participante",
      email: user.email ?? "",
      image: user.image,
    };
  } catch {
    return null;
  }
}
