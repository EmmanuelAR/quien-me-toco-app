import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { colors } from "@/lib/brand/tokens";
import { copy } from "@/lib/copy/es-CR";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function cssVar(name: string): string | null {
  const m = new RegExp(`${name}:\\s*([^;]+);`).exec(css);
  return m ? m[1].trim().toLowerCase() : null;
}

describe("tokens de marca", () => {
  it("globals.css y tokens.ts dicen lo mismo", () => {
    expect(cssVar("--color-bg")).toBe(colors.bg);
    expect(cssVar("--color-ink")).toBe(colors.ink);
    expect(cssVar("--color-ink-soft")).toBe(colors.inkSoft);
    expect(cssVar("--color-line")).toBe(colors.line);
    expect(cssVar("--color-marker-blue")).toBe(colors.markerBlue);
    expect(cssVar("--color-marker-pink")).toBe(colors.markerPink);
    expect(cssVar("--color-marker-blue-soft")).toBe(colors.markerBlueSoft);
    expect(cssVar("--color-marker-pink-soft")).toBe(colors.markerPinkSoft);
  });

  it("los colores de marca son los de ear.dev", () => {
    expect(colors.markerBlue).toBe("#a4c7f1");
    expect(colors.markerPink).toBe("#f1a4a6");
    expect(colors.bg).toBe("#ffffff");
  });

  it("no hay gradientes en el css", () => {
    expect(css).not.toMatch(/gradient\(/);
  });

});

function walk(value: unknown, visit: (s: string) => void) {
  if (typeof value === "string") visit(value);
  else if (typeof value === "function") visit(String((value as (...a: never[]) => string)(3 as never, 8 as never)));
  else if (Array.isArray(value)) value.forEach((v) => walk(v, visit));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => walk(v, visit));
}

describe("textos", () => {
  it("todo en minúsculas (salvo @ear.dev y siglas de moneda)", () => {
    const offenders: string[] = [];
    walk(copy, (s) => {
      const cleaned = s.replace(/@ear\.dev/g, "").replace(/\b(CRC|QR|PWA)\b/g, "");
      if (cleaned !== cleaned.toLowerCase()) offenders.push(s);
    });
    expect(offenders).toEqual([]);
  });

  it("los textos no llevan emojis", () => {
    const offenders: string[] = [];
    walk(copy, (s) => {
      if (/\p{Extended_Pictographic}/u.test(s)) offenders.push(s);
    });
    expect(offenders).toEqual([]);
  });
});
