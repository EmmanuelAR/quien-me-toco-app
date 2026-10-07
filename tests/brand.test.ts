import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { colors } from "@/lib/brand/tokens";
import { copy } from "@/lib/copy/es-CR";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function cssVar(name: string): string | null {
  const m = new RegExp(`${name}:\\s*([^;]+);`).exec(css);
  return m ? m[1].trim().toLowerCase() : null;
}

/** contraste wcag 2 entre dos colores #rrggbb */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("tokens de marca", () => {
  it("globals.css y tokens.ts dicen lo mismo", () => {
    expect(cssVar("--color-bg")).toBe(colors.bg);
    expect(cssVar("--color-ink")).toBe(colors.ink);
    expect(cssVar("--color-ink-soft")).toBe(colors.inkSoft);
    expect(cssVar("--color-line")).toBe(colors.line);
    expect(cssVar("--color-line-strong")).toBe(colors.lineStrong);
    expect(cssVar("--color-surface")).toBe(colors.surface);
    expect(cssVar("--color-link")).toBe(colors.link);
  });

  it("el texto gris y los links se leen sobre blanco y sobre gris claro (4.5:1)", () => {
    for (const bg of [colors.bg, colors.surface]) {
      expect(contrast(colors.ink, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.inkSoft, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.link, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("el borde de los campos se distingue del fondo (3:1)", () => {
    expect(contrast(colors.lineStrong, colors.bg)).toBeGreaterThanOrEqual(3);
  });

  it("no hay gradientes en el css", () => {
    expect(css).not.toMatch(/gradient\(/);
  });

  it("nada fuerza minúsculas", () => {
    expect(css).not.toMatch(/text-transform:\s*lowercase/);
  });
});

/** recorre los textos con su ruta; las funciones se prueban con nombres de ejemplo */
function walk(value: unknown, visit: (s: string, path: string) => void, path = "") {
  if (typeof value === "string") visit(value, path);
  else if (typeof value === "function") visit(String((value as (...a: never[]) => string)("Ana" as never, "Beto" as never)), path);
  else if (Array.isArray(value)) value.forEach((v, i) => walk(v, visit, `${path}.${i}`));
  else if (value && typeof value === "object") Object.entries(value).forEach(([k, v]) => walk(v, visit, path ? `${path}.${k}` : k));
}

function offenders(test: (s: string, path: string) => boolean): string[] {
  const out: string[] = [];
  walk(copy, (s, path) => {
    if (test(s, path)) out.push(`${path}: ${s}`);
  });
  return out;
}

/** textos que van en medio de una frase armada en pantalla */
const midSentence = new Set(["finalReveal.gaveTo"]);

describe("textos", () => {
  it("cada texto empieza con mayúscula (o con ¿, ¡, « o un número)", () => {
    expect(
      offenders((s, path) => {
        if (midSentence.has(path)) return false;
        const first = s.replace(/^[¿¡«]+/, "").charAt(0);
        return first !== first.toLocaleUpperCase("es");
      }),
    ).toEqual([]);
  });

  it("las preguntas abren con ¿ y las exclamaciones con ¡", () => {
    const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;
    expect(offenders((s) => count(s, /\?/g) !== count(s, /¿/g) || count(s, /!/g) !== count(s, /¡/g))).toEqual([]);
  });

  it("los puntos suspensivos son …, no tres puntos", () => {
    expect(offenders((s) => s.includes("..."))).toEqual([]);
  });

  it("los nombres propios van con su forma (ear.dev se escribe así)", () => {
    expect(
      offenders((s) => /\b(google|apple|whatsapp|iphone|android|starknet|resend|instagram|qr)\b/.test(s.replace(/@?ear\.dev/g, ""))),
    ).toEqual([]);
  });

  it("los textos no llevan emojis", () => {
    expect(offenders((s) => /\p{Extended_Pictographic}/u.test(s))).toEqual([]);
  });
});
