export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string; code?: string };
  if (!res.ok) {
    const err = new Error(body.error || `http ${res.status}`) as Error & { status: number; code?: string };
    err.status = res.status;
    err.code = body.code;
    throw err;
  }
  return body;
}
