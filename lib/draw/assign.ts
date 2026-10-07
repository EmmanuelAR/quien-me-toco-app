import { cryptoRng, type Rng } from "@/lib/crypto/random";

/**
 * el sorteo: una permutación sin puntos fijos (nadie se toca a sí mismo) que respeta
 * las exclusiones. es una función pura y se usa igual en el cliente (para avisar
 * "con estas reglas no sale" al editar exclusiones) y en el servidor (el sorteo real).
 */
export interface DrawConstraints {
  /** cuántos participan; los índices van de 0 a n-1 */
  n: number;
  /** exclusiones de la admin: a no le regala a b y b no le regala a a */
  pairs: Array<[number, number]>;
  /** previous[i] = a quién le regaló i el año pasado (null si no estaba). direccional. */
  previous?: Array<number | null>;
}

export interface DrawOptions {
  rng?: Rng;
  /** intentos de permutación uniforme antes de pasar al backtracking */
  shuffleAttempts?: number;
  /** tope de nodos del backtracking antes de rendirse */
  maxNodes?: number;
}

export const MIN_PARTICIPANTS = 3;

/** conjuntos de prohibidos por persona, a partir de las reglas */
export function buildForbidden(c: DrawConstraints): Array<Set<number>> {
  const forbidden: Array<Set<number>> = Array.from({ length: c.n }, (_, i) => new Set([i]));
  for (const [a, b] of c.pairs) {
    if (!inRange(a, c.n) || !inRange(b, c.n)) throw new RangeError(`exclusión fuera de rango: ${a},${b}`);
    if (a === b) continue;
    forbidden[a].add(b);
    forbidden[b].add(a);
  }
  if (c.previous) {
    c.previous.forEach((p, i) => {
      if (p !== null && p !== undefined && inRange(p, c.n) && i < c.n) forbidden[i].add(p);
    });
  }
  return forbidden;
}

function inRange(i: number, n: number) {
  return Number.isInteger(i) && i >= 0 && i < n;
}

/** ¿esta permutación cumple todas las reglas? */
export function isValidAssignment(receivers: number[], c: DrawConstraints): boolean {
  if (receivers.length !== c.n) return false;
  const forbidden = buildForbidden(c);
  const seen = new Uint8Array(c.n);
  for (let i = 0; i < c.n; i++) {
    const r = receivers[i];
    if (!inRange(r, c.n) || seen[r] || forbidden[i].has(r)) return false;
    seen[r] = 1;
  }
  return true;
}

function fisherYates(n: number, rng: Rng): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * devuelve receivers[i] = índice de la persona a la que le regala i,
 * o null si con estas reglas no existe ninguna asignación válida.
 */
export function assign(c: DrawConstraints, opts: DrawOptions = {}): number[] | null {
  const rng = opts.rng ?? cryptoRng;
  const shuffleAttempts = opts.shuffleAttempts ?? 2000;
  const maxNodes = opts.maxNodes ?? 200_000;

  if (!Number.isInteger(c.n) || c.n < MIN_PARTICIPANTS) return null;
  const forbidden = buildForbidden(c);

  // chequeos rápidos de infactibilidad
  for (let i = 0; i < c.n; i++) if (forbidden[i].size >= c.n) return null;

  // 1) reintentos uniformes: permutación al azar y verificar
  for (let attempt = 0; attempt < shuffleAttempts; attempt++) {
    const perm = fisherYates(c.n, rng);
    let ok = true;
    for (let i = 0; i < c.n; i++) {
      if (forbidden[i].has(perm[i])) {
        ok = false;
        break;
      }
    }
    if (ok) return perm;
  }

  // 2) backtracking aleatorizado con heurística mrv (el más restringido primero)
  const order = Array.from({ length: c.n }, (_, i) => i).sort(
    (a, b) => forbidden[b].size - forbidden[a].size,
  );
  const receivers = new Array<number>(c.n).fill(-1);
  const taken = new Uint8Array(c.n);
  let nodes = 0;

  const search = (depth: number): boolean => {
    if (depth === c.n) return true;
    if (++nodes > maxNodes) return false;
    const giver = order[depth];
    const candidates: number[] = [];
    for (let r = 0; r < c.n; r++) if (!taken[r] && !forbidden[giver].has(r)) candidates.push(r);
    // barajar candidatos con el mismo rng
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = rng.int(i + 1);
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    for (const r of candidates) {
      receivers[giver] = r;
      taken[r] = 1;
      if (search(depth + 1)) return true;
      taken[r] = 0;
      receivers[giver] = -1;
      if (nodes > maxNodes) return false;
    }
    return false;
  };

  return search(0) ? receivers : null;
}

/** ¿hay al menos una asignación válida? (para la ui de exclusiones) */
export function isFeasible(c: DrawConstraints, opts: DrawOptions = {}): boolean {
  return assign(c, { ...opts, shuffleAttempts: opts.shuffleAttempts ?? 50 }) !== null;
}

/** descompone la permutación en ciclos para la animación de cadena de la revelación */
export function cycles(receivers: number[]): number[][] {
  const seen = new Uint8Array(receivers.length);
  const out: number[][] = [];
  for (let start = 0; start < receivers.length; start++) {
    if (seen[start]) continue;
    const cycle: number[] = [];
    let i = start;
    while (!seen[i]) {
      seen[i] = 1;
      cycle.push(i);
      i = receivers[i];
    }
    out.push(cycle);
  }
  return out;
}
