import "server-only";
import { Redis } from "@upstash/redis";
import { serverEnv } from "./env";

/**
 * kv mínimo (upstash redis, plan gratis). solo guarda lo que no puede ir a la cadena:
 * correos + nonce, estado de envíos, links privados de los sin cuenta y locks.
 * todo lleva ttl: se borra solo después del intercambio.
 *
 * sin credenciales (desarrollo local) usa una memoria en proceso, con ttl también,
 * para poder correr la app sin crear cuentas.
 */
export interface KvStore {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number; nx?: boolean }): Promise<boolean>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
}

class MemoryKv implements KvStore {
  private data = new Map<string, { value: unknown; expiresAt: number | null }>();

  private alive(key: string) {
    const e = this.data.get(key);
    if (!e) return null;
    if (e.expiresAt !== null && e.expiresAt < Date.now()) {
      this.data.delete(key);
      return null;
    }
    return e;
  }
  async get<T>(key: string) {
    const e = this.alive(key);
    return e ? (e.value as T) : null;
  }
  async set(key: string, value: unknown, opts?: { ex?: number; nx?: boolean }) {
    if (opts?.nx && this.alive(key)) return false;
    this.data.set(key, { value, expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : null });
    return true;
  }
  async del(key: string) {
    this.data.delete(key);
  }
  async incr(key: string) {
    const current = Number((await this.get<number>(key)) ?? 0) + 1;
    await this.set(key, current);
    return current;
  }
}

class UpstashKv implements KvStore {
  constructor(private redis: Redis) {}
  async get<T>(key: string) {
    return (await this.redis.get<T>(key)) ?? null;
  }
  async set(key: string, value: unknown, opts?: { ex?: number; nx?: boolean }) {
    const payload = typeof value === "string" ? value : JSON.stringify(value);
    let res: unknown;
    if (opts?.ex && opts.nx) res = await this.redis.set(key, payload, { ex: opts.ex, nx: true });
    else if (opts?.ex) res = await this.redis.set(key, payload, { ex: opts.ex });
    else if (opts?.nx) res = await this.redis.set(key, payload, { nx: true });
    else res = await this.redis.set(key, payload);
    return res === "OK";
  }
  async del(key: string) {
    await this.redis.del(key);
  }
  async incr(key: string) {
    return this.redis.incr(key);
  }
}

const memory = new MemoryKv();
let upstash: UpstashKv | null = null;

export function kv(): KvStore {
  if (serverEnv.upstashUrl && serverEnv.upstashToken) {
    if (!upstash) {
      upstash = new UpstashKv(new Redis({ url: serverEnv.upstashUrl, token: serverEnv.upstashToken, automaticDeserialization: true }));
    }
    return upstash;
  }
  return memory;
}

export const kvIsPersistent = () => Boolean(serverEnv.upstashUrl && serverEnv.upstashToken);

/* ---------- llaves ---------- */

export const keys = {
  email: (groupId: bigint, account: string) => `g:${groupId}:email:${account.toLowerCase()}`,
  mail: (groupId: bigint, index: number) => `g:${groupId}:mail:${index}`,
  ghostToken: (groupId: bigint, index: number) => `g:${groupId}:ghost:${index}`,
  ghost: (token: string) => `ghost:${token}`,
  ghostUsed: (token: string) => `ghost:${token}:used`,
  ghostSession: (deviceToken: string) => `ghostsess:${deviceToken}`,
  lock: (name: string) => `lock:${name}`,
  drawTx: (groupId: bigint) => `g:${groupId}:tx:draw`,
  revealTx: (groupId: bigint) => `g:${groupId}:tx:reveal`,
  inviteCode: (groupId: bigint) => `g:${groupId}:invite`,
};

/** segundos hasta 7 días después del intercambio (mínimo 1 día) */
export function ttlForEvent(eventAt: number): number {
  const until = eventAt + 7 * 86400 - Math.floor(Date.now() / 1000);
  return Math.max(until, 86400);
}
