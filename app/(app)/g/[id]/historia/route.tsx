import { ImageResponse } from "next/og";
import { readGroupSafe } from "@/lib/contract/reads";
import { og, ogFonts } from "@/lib/og/brand";
import { brand } from "@/lib/brand/tokens";
import { INSTAGRAM_HANDLE } from "@/lib/brand/links";
import { copy } from "@/lib/copy/es-CR";
import { parseGroupId } from "@/lib/server/http";

/**
 * imagen 1080×1920 para subir a la historia de instagram agradeciendo a @ear.dev.
 * sin datos privados: solo el nombre del grupo.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const groupId = parseGroupId(id);
  const group = groupId ? await readGroupSafe(groupId).catch(() => null) : null;
  const fonts = await ogFonts();
  const name = group?.name ?? "Amigo secreto";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 110,
          backgroundColor: og.bg,
          color: og.ink,
          fontFamily: og.font,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div style={{ display: "flex", fontSize: 46, color: og.inkSoft, lineHeight: 1.3 }}>Hicimos nuestro amigo secreto con</div>
          <div style={{ display: "flex", fontSize: 128, fontWeight: 600, lineHeight: 1.02, letterSpacing: "-0.02em", whiteSpace: "pre-line" }}>
            {brand.name.replace(" ", "\n")}
          </div>
          <div style={{ display: "flex", fontSize: name.length > 20 ? 52 : 64, lineHeight: 1.2 }}>{name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, borderTop: `3px solid ${og.line}`, paddingTop: 48 }}>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 600 }}>{copy.pay.storyShareText(INSTAGRAM_HANDLE)}</div>
          <div style={{ display: "flex", fontSize: 36, color: og.inkSoft }}>Gratis, sin anuncios y hecho con cariño.</div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts,
      headers: { "cache-control": "public, max-age=3600" },
    },
  );
}
