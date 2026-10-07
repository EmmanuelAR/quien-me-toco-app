import { generateKeyPair, publicKeyOf, type KeyPair } from "./sealedbox";
import { bytesEqual } from "./random";

/**
 * la llave x25519 del participante vive en este dispositivo (indexeddb).
 * se guarda por cuenta: la misma llave sirve para todos los grupos de esa cuenta
 * en este teléfono. si la cadena tiene otra pubkey para un grupo (otro dispositivo),
 * la app rota la llave: ver useSlip en components/draw.
 */
const DB_NAME = "quien-me-toco";
const STORE = "keys";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

function keyFor(account: string) {
  return `sk:${account.toLowerCase()}`;
}

export async function loadSecretKey(account: string): Promise<Uint8Array | null> {
  try {
    const v = await tx<Uint8Array | ArrayBuffer | undefined>("readonly", (s) => s.get(keyFor(account)));
    if (!v) return null;
    return v instanceof Uint8Array ? v : new Uint8Array(v);
  } catch {
    return null;
  }
}

export async function saveSecretKey(account: string, secretKey: Uint8Array): Promise<void> {
  await tx("readwrite", (s) => s.put(secretKey, keyFor(account)));
}

/** devuelve la llave de este dispositivo para la cuenta, creándola si no existe */
export async function ensureKeyPair(account: string): Promise<KeyPair> {
  const existing = await loadSecretKey(account);
  if (existing) return { secretKey: existing, publicKey: publicKeyOf(existing) };
  const kp = generateKeyPair();
  await saveSecretKey(account, kp.secretKey);
  return kp;
}

/** ¿la llave local corresponde a la pubkey que está en la cadena? */
export async function matchesOnChain(account: string, onChainPub: Uint8Array): Promise<KeyPair | null> {
  const sk = await loadSecretKey(account);
  if (!sk) return null;
  const pub = publicKeyOf(sk);
  return bytesEqual(pub, onChainPub) ? { secretKey: sk, publicKey: pub } : null;
}

/** rota: genera y guarda una llave nueva para la cuenta en este dispositivo */
export async function rotateKeyPair(account: string): Promise<KeyPair> {
  const kp = generateKeyPair();
  await saveSecretKey(account, kp.secretKey);
  return kp;
}
