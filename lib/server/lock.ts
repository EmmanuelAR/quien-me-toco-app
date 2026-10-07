import "server-only";
import { keys, kv } from "./kv";

export class LockBusyError extends Error {
  constructor(name: string) {
    super(`ocupado: ${name}`);
    this.name = "LockBusyError";
  }
}

/**
 * lock simple con SET NX EX. evita que dos funciones serverless manden tx desde la
 * cuenta del servidor al mismo tiempo (chocarían en el nonce) o sorteen dos veces.
 */
export async function withLock<T>(name: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const store = kv();
  const key = keys.lock(name);
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const acquired = await store.set(key, token, { ex: ttlSeconds, nx: true });
  if (!acquired) throw new LockBusyError(name);
  try {
    return await fn();
  } finally {
    const current = await store.get<string>(key);
    if (current === token) await store.del(key);
  }
}
