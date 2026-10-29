import { ImageResponse } from "next/og";

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
          backgroundColor: "#ffffff",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              textAlign: "center",
              color: "#1d1d1f",
            }}
          >
            ¿Quién me tocó?
          </div>
          <div
            style={{
              fontSize: 28,
              textAlign: "center",
              color: "#6e6e73",
              maxWidth: 720,
              lineHeight: 1.4,
            }}
          >
            Amigo secreto online gratis. Sorteo por WhatsApp, exclusiones, lista de deseos.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
