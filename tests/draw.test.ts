import { describe, expect, it } from "vitest";
import { assign, buildForbidden, cycles, isFeasible, isValidAssignment, type DrawConstraints } from "@/lib/draw/assign";
import { cryptoRng, seededRng } from "@/lib/crypto/random";

function expectValid(receivers: number[] | null, c: DrawConstraints) {
  expect(receivers).not.toBeNull();
  const r = receivers!;
  expect(r).toHaveLength(c.n);
  // nadie se toca a sí mismo
  r.forEach((rec, i) => expect(rec).not.toBe(i));
  // todos regalan y reciben exactamente una vez
  expect(new Set(r).size).toBe(c.n);
  // respeta exclusiones (pares en ambas direcciones, año pasado direccional)
  const forbidden = buildForbidden(c);
  r.forEach((rec, i) => expect(forbidden[i].has(rec)).toBe(false));
  expect(isValidAssignment(r, c)).toBe(true);
}

describe("assign", () => {
  it("nadie se asigna a sí mismo y todos quedan emparejados", () => {
    for (let n = 3; n <= 12; n++) {
      const c = { n, pairs: [] };
      expectValid(assign(c), c);
    }
  });

  it("respeta pares excluidos en las dos direcciones", () => {
    const c: DrawConstraints = { n: 6, pairs: [[0, 1], [2, 3]] };
    for (let i = 0; i < 50; i++) {
      const r = assign(c, { rng: seededRng(i) });
      expectValid(r, c);
      expect(r![0]).not.toBe(1);
      expect(r![1]).not.toBe(0);
      expect(r![2]).not.toBe(3);
      expect(r![3]).not.toBe(2);
    }
  });

  it("respeta 'que no te toque la misma persona del año pasado' (direccional)", () => {
    const previous = [1, 2, 0, null]; // 0→1, 1→2, 2→0 el año pasado; 3 es nuevo
    const c: DrawConstraints = { n: 4, pairs: [], previous };
    for (let i = 0; i < 50; i++) {
      const r = assign(c, { rng: seededRng(i) });
      expectValid(r, c);
      expect(r![0]).not.toBe(1);
      expect(r![1]).not.toBe(2);
      expect(r![2]).not.toBe(0);
    }
  });

  it("con 3 personas la exclusión del año pasado sigue teniendo solución (por ser direccional)", () => {
    const c: DrawConstraints = { n: 3, pairs: [], previous: [1, 2, 0] };
    const r = assign(c, { rng: seededRng(7) });
    expect(r).toEqual([2, 0, 1]);
  });

  it("devuelve null cuando no hay solución", () => {
    // 3 personas y una pareja excluida: 0 y 1 solo pueden regalarle a 2
    expect(assign({ n: 3, pairs: [[0, 1]] })).toBeNull();
    // 4 personas, 0 excluido con todos
    expect(assign({ n: 4, pairs: [[0, 1], [0, 2], [0, 3]] })).toBeNull();
    // violación de hall: 0 y 1 solo pueden regalarle a 3
    expect(assign({ n: 4, pairs: [[0, 1], [0, 2], [1, 2]] })).toBeNull();
    // menos de 3 no hay secreto
    expect(assign({ n: 2, pairs: [] })).toBeNull();
    expect(assign({ n: 0, pairs: [] })).toBeNull();
  });

  it("isFeasible coincide con assign", () => {
    expect(isFeasible({ n: 3, pairs: [[0, 1]] })).toBe(false);
    expect(isFeasible({ n: 5, pairs: [[0, 1], [2, 3]] })).toBe(true);
  });

  it("es determinista con un rng inyectado", () => {
    const c: DrawConstraints = { n: 8, pairs: [[0, 1]] };
    const a = assign(c, { rng: seededRng(42) });
    const b = assign(c, { rng: seededRng(42) });
    expect(a).toEqual(b);
  });

  it("usa el backtracking cuando los reintentos no alcanzan y aun así cumple", () => {
    // muy restringido: casi un ciclo forzado
    const n = 7;
    const pairs: Array<[number, number]> = [];
    for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) if (!(i === 0 && j === n - 1)) pairs.push([i, j]);
    const c: DrawConstraints = { n, pairs };
    const r = assign(c, { rng: seededRng(3), shuffleAttempts: 1 });
    expectValid(r, c);
  });

  it("no está degenerado: en muchas corridas aparecen distintas asignaciones", () => {
    const c: DrawConstraints = { n: 5, pairs: [] };
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(assign(c, { rng: cryptoRng })!.join(","));
    // hay 44 derangements de 5; con 200 corridas deberíamos ver bastantes
    expect(seen.size).toBeGreaterThan(20);
  });

  it("rechaza exclusiones fuera de rango", () => {
    expect(() => assign({ n: 3, pairs: [[0, 9]] })).toThrow(RangeError);
  });
});

describe("cycles", () => {
  it("descompone la permutación en ciclos", () => {
    expect(cycles([1, 0, 3, 4, 2])).toEqual([
      [0, 1],
      [2, 3, 4],
    ]);
  });
});
