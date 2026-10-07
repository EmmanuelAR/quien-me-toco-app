/**
 * tokens de la app en TS.
 * se usan donde Tailwind no llega: imágenes con next/og, correos y los íconos.
 * app/globals.css (@theme) es la fuente para la app; tests/brand.test.ts
 * verifica que los valores de aquí y los de ahí sean los mismos.
 */
export const colors = {
  bg: "#ffffff",
  ink: "#1d1d1f",
  inkSoft: "#6e6e73",
  line: "#d2d2d7",
  lineStrong: "#86868b",
  surface: "#f5f5f7",
  link: "#0066cc",
} as const;

export const radius = { sm: 12, md: 18, lg: 28, pill: 999 } as const;

/** la letra del sistema: SF en iPhone y Mac, Roboto en Android */
export const fontFamily =
  '-apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const brand = {
  name: "¿Quién me tocó?",
  shortName: "Quién me tocó",
  author: "ear.dev",
  themeColor: colors.bg,
  backgroundColor: colors.bg,
} as const;
