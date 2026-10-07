import { ImageResponse } from "next/og";
import { readGroupSafe } from "@/lib/contract/reads";
import { formatDate } from "@/lib/format";
import { markerStyle, og, ogFonts } from "@/lib/og/brand";
import { brand } from "@/lib/brand/tokens";

export const alt = "¿quién me tocó? — invitación al amigo secreto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** la vista previa que sale en whatsapp al compartir el link de invitación */
export default async function Image({ params }: { params: Promise<{ id: string; code: string }> }) {
  const { id } = await params;
  const group = /^\d+$/.test(id) ? await readGroupSafe(BigInt(id)).catch(() => null) : null;
  const fonts = await ogFonts();

  const name = (group?.name ?? "amigo secreto").toLowerCase();
  const when = group ? formatDate(group.eventAt, { timeZone: "America/Costa_Rica" }) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: og.bg,
          color: og.ink,
          fontFamily: og.font,
        }}
      >
        <div style={{ display: "flex", fontSize: 34, color: og.inkSoft }}>te invitaron a</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <div style={{ ...markerStyle("blue"), fontSize: name.length > 24 ? 60 : 80, fontWeight: 600, lineHeight: 1.15 }}>{name}</div>
          </div>
          {when && (
            <div style={{ display: "flex" }}>
              <div style={{ ...markerStyle("pink"), fontSize: 40, lineHeight: 1.3 }}>{when}</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 600 }}>{brand.name}</div>
          <div style={{ display: "flex", fontSize: 28, color: og.inkSoft }}>apuntate con el link</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
