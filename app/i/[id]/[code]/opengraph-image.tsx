import { ImageResponse } from "next/og";
import { readGroupSafe } from "@/lib/contract/reads";
import { capitalize, formatDate } from "@/lib/format";
import { og, ogFonts } from "@/lib/og/brand";
import { brand } from "@/lib/brand/tokens";

export const alt = "Invitación al amigo secreto en ¿Quién me tocó?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** la vista previa que sale en whatsapp al compartir el link de invitación */
export default async function Image({ params }: { params: Promise<{ id: string; code: string }> }) {
  const { id } = await params;
  const group = /^\d+$/.test(id) ? await readGroupSafe(BigInt(id)).catch(() => null) : null;
  const fonts = await ogFonts();

  const name = group?.name ?? "Amigo secreto";
  const when = group ? capitalize(formatDate(group.eventAt, { timeZone: "America/Costa_Rica" })) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          backgroundColor: og.bg,
          color: og.ink,
          fontFamily: og.font,
        }}
      >
        <div style={{ display: "flex", fontSize: 34, color: og.inkSoft }}>Te invitaron a</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: name.length > 24 ? 64 : 88, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            {name}
          </div>
          {when && <div style={{ display: "flex", fontSize: 40, color: og.inkSoft }}>{when}</div>}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: `2px solid ${og.line}`,
            paddingTop: 28,
          }}
        >
          <div style={{ display: "flex", fontSize: 40, fontWeight: 600 }}>{brand.name}</div>
          <div style={{ display: "flex", fontSize: 28, color: og.inkSoft }}>Apuntate con el link</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
