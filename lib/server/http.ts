import "server-only";
import { NextResponse } from "next/server";
import { AuthError } from "./auth";
import { LockBusyError } from "./lock";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function parseGroupId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = BigInt(raw);
  return id > 0n ? id : null;
}

/** respuesta uniforme para errores de las rutas */
export function handleError(e: unknown) {
  if (e instanceof AuthError) return json({ error: e.message }, e.status);
  if (e instanceof LockBusyError) return json({ error: "ocupado, probá en un momento", busy: true }, 409);
  const message = e instanceof Error ? e.message : String(e);
  console.error("[api]", message);
  return json({ error: message }, 500);
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
