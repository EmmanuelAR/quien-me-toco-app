import type { Metadata, Viewport } from "next";
import "./globals.css";
import { brand, colors } from "@/lib/brand/tokens";
import { Providers } from "@/components/cavos/Providers";
import { SwRegister } from "@/components/pwa/SwRegister";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://quien-me-toco-app.vercel.app";
const seoTitle = "Amigo secreto online gratis: sorteo con WhatsApp | ¿Quién me tocó?";
const seoDescription = "Hacé el sorteo del amigo secreto online gratis. Invitá por WhatsApp, poné exclusiones y lista de deseos, y cada quien ve solo a quién le tocó. Hecho en Costa Rica.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: seoTitle,
    template: `%s | ${brand.shortName}`,
  },
  description: seoDescription,
  applicationName: brand.shortName,
  authors: [{ name: brand.author, url: "https://ear.dev" }],
  keywords: ["amigo secreto", "amigo invisible", "intercambio navideño", "sorteo online", "gratis", "WhatsApp", "Costa Rica"],
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    title: brand.shortName,
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "es_CR",
    url: "/",
    siteName: brand.shortName,
    title: "Amigo secreto online gratis | ¿Quién me tocó?",
    description: "Sorteo de amigo secreto por WhatsApp, con exclusiones y lista de deseos.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: colors.bg,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "¿Quién me tocó?",
  alternateName: "Amigo secreto online gratis",
  description: seoDescription,
  url: appUrl,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "Emmanuel Agüero Rojas",
    url: "https://ear.dev",
  },
  inLanguage: "es-CR",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CR" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
        <SwRegister />
      </body>
    </html>
  );
}
