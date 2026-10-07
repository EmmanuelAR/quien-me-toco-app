import type { Metadata, Viewport } from "next";
import "./globals.css";
import { brand, colors } from "@/lib/brand/tokens";
import { copy } from "@/lib/copy/es-CR";
import { Providers } from "@/components/cavos/Providers";
import { SwRegister } from "@/components/pwa/SwRegister";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: brand.name,
    template: `%s · ${brand.shortName}`,
  },
  description: copy.app.tagline,
  applicationName: brand.shortName,
  authors: [{ name: brand.author, url: "https://ear.dev" }],
  appleWebApp: {
    capable: true,
    title: brand.shortName,
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "es_CR",
    siteName: brand.shortName,
    title: brand.name,
    description: copy.app.tagline,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: colors.bg,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
        <SwRegister />
      </body>
    </html>
  );
}
