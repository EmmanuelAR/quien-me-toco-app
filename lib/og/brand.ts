import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { colors } from "@/lib/brand/tokens";

/**
 * piezas compartidas para las imágenes generadas con next/og:
 * la vista previa de whatsapp y la imagen de la historia de instagram.
 * los archivos van relativos a la raíz del proyecto (así los incluye vercel).
 */
let fontsPromise: Promise<{ regular: Buffer; semibold: Buffer }> | null = null;

export function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      readFile(join(process.cwd(), "lib/brand/fonts/inter-400.woff")),
      readFile(join(process.cwd(), "lib/brand/fonts/inter-600.woff")),
    ]).then(([regular, semibold]) => ({ regular, semibold }));
  }
  return fontsPromise;
}

export async function ogFonts() {
  const { regular, semibold } = await loadFonts();
  return [
    { name: "Inter", data: regular, style: "normal" as const, weight: 400 as const },
    { name: "Inter", data: semibold, style: "normal" as const, weight: 600 as const },
  ];
}

export const og = {
  bg: colors.bg,
  ink: colors.ink,
  inkSoft: colors.inkSoft,
  blue: colors.markerBlue,
  pink: colors.markerPink,
  font: "Inter",
};

/** estilo del "marcador" detrás de una palabra (satori acepta solo flex + estilos inline) */
export function markerStyle(tone: "blue" | "pink" = "blue"): Record<string, string | number> {
  return {
    backgroundColor: tone === "blue" ? og.blue : og.pink,
    padding: "0 14px",
    borderRadius: 12,
    display: "flex",
  };
}
