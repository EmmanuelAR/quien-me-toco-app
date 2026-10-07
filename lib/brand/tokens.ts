/**
 * design tokens de ear.dev en TS.
 * se usan donde Tailwind no llega: imágenes con next/og, correos y el service worker.
 * app/globals.css (@theme) es la fuente para la app; tests/brand.test.ts
 * verifica que los valores de aquí y los de ahí sean los mismos.
 */
export const colors = {
  bg: "#ffffff",
  ink: "#111111",
  inkSoft: "#6b6b6b",
  line: "#e8e8e8",
  surface: "#fafafa",
  markerBlue: "#a4c7f1",
  markerPink: "#f1a4a6",
  markerBlueSoft: "#e4eefb",
  markerPinkSoft: "#fbe4e5",
} as const;

export const radius = { sm: 8, md: 14, pill: 999 } as const;

export const fontFamily =
  'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export const brand = {
  name: "¿quién me tocó?",
  shortName: "quién me tocó",
  author: "ear.dev",
  themeColor: colors.bg,
  backgroundColor: colors.bg,
} as const;
