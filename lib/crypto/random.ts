/**
 * aleatoriedad criptográfica, igual en el navegador y en node (globalThis.crypto).
 * el sorteo recibe un `Rng` inyectable para poder probarlo de forma determinista.
 */
export interface Rng {
  /** entero uniforme en [0, maxExclusive) */
  int(maxExclusive: number): number;
  bytes(n: number): Uint8Array;
}

function webCrypto(): Crypto {
  const c = globalThis.crypto;
  if (!c || typeof c.getRandomValues !== "function") {
    throw new Error("crypto.getRandomValues no está disponible");
  }
  return c;
}

export function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  webCrypto().getRandomValues(out);
  return out;
}

/** entero uniforme sin sesgo (rejection sampling sobre 32 bits) */
export function randomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > 0x1_0000_0000) {
    throw new RangeError("randomInt: rango inválido");
  }
  if (maxExclusive === 1) return 0;
  const limit = 0x1_0000_0000 - (0x1_0000_0000 % maxExclusive);
  const buf = new Uint32Array(1);
  const c = webCrypto();
  for (;;) {
    c.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % maxExclusive;
  }
}

export const cryptoRng: Rng = {
  int: randomInt,
  bytes: randomBytes,
};

/** rng determinista (xorshift128+) solo para tests; nunca para el sorteo real */
export function seededRng(seed: number): Rng {
  let s0 = (seed >>> 0) || 0x9e3779b9;
  let s1 = (Math.imul(seed, 0x85ebca6b) >>> 0) || 0x243f6a88;
  const next = () => {
    let x = s0;
    const y = s1;
    s0 = y;
    x ^= x << 23;
    x ^= x >>> 17;
    x ^= y ^ (y >>> 26);
    s1 = x >>> 0;
    return (s0 + s1) >>> 0;
  };
  return {
    int(maxExclusive) {
      return next() % maxExclusive;
    },
    bytes(n) {
      const out = new Uint8Array(n);
      for (let i = 0; i < n; i++) out[i] = next() & 0xff;
      return out;
    },
  };
}

export function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) throw new Error("hex impar");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToBigInt(bytes: Uint8Array): bigint {
  let v = 0n;
  for (const b of bytes) v = (v << 8n) | BigInt(b);
  return v;
}

export function bigIntToBytes(value: bigint, length: number): Uint8Array {
  const out = new Uint8Array(length);
  let v = value;
  for (let i = length - 1; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  if (v !== 0n) throw new RangeError("bigIntToBytes: no cabe");
  return out;
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = typeof btoa === "function" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
