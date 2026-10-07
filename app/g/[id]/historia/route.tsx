import { ImageResponse } from "next/og";
import { readGroupSafe } from "@/lib/contract/reads";
import { markerStyle, og, ogFonts } from "@/lib/og/brand";
import { brand } from "@/lib/brand/tokens";
import { INSTAGRAM_HANDLE } from "@/lib/brand/links";
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
  const name = (group?.name ?? "amigo secreto").toLowerCase();

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
          <div style={{ display: "flex", fontSize: 52, color: og.inkSoft, lineHeight: 1.3 }}>hicimos nuestro amigo secreto con</div>
          <div style={{ display: "flex" }}>
            <div style={{ ...markerStyle("blue"), fontSize: 96, fontWeight: 600, lineHeight: 1.15 }}>{brand.name}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <div style={{ ...markerStyle("pink"), fontSize: name.length > 20 ? 48 : 64, lineHeight: 1.25 }}>{name}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 600 }}>gracias {INSTAGRAM_HANDLE}</div>
          <div style={{ display: "flex", fontSize: 36, color: og.inkSoft }}>gratis, sin anuncios, hecho con cariño</div>
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
