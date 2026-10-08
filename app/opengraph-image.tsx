import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Amigo secreto online gratis - ¿Quién me tocó?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
          padding: 60,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 120,
              display: "flex",
            }}
          >
            🎁
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              textAlign: "center",
              color: "#1D1D1F",
            }}
          >
            ¿Quién me tocó?
          </div>
          <div
            style={{
              fontSize: 32,
              textAlign: "center",
              color: "#666",
              maxWidth: 800,
            }}
          >
            Amigo secreto online gratis. Sorteo por WhatsApp, exclusiones, lista de deseos.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
