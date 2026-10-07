import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // la app lee la chain desde el navegador y casi todo es dinámico:
  // el modelo clásico (sin cache components) es más simple para este caso.
  cacheComponents: false,
  experimental: {
    // con la caché que vercel restaura entre deploys, el css de tailwind salía de un build viejo
    turbopackFileSystemCacheForBuild: false,
  },
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // un día: las caritas e íconos se van a reemplazar por las ilustraciones finales
        source: "/(icons|stamps)/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
