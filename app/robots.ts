import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = publicEnv.appUrl;

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacidad", "/terminos", "/dashboard"],
        disallow: ["/g/", "/i/", "/nuevo", "/auth/", "/approve-device", "/revoke-device", "/p/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
