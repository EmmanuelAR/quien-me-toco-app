import { Body, Container, Head, Html, Link, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";
import { colors, fontFamily } from "@/lib/brand/tokens";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/brand/links";

export interface BaseEmailProps {
  preview: string;
  appUrl: string;
  children: ReactNode;
}

export const styles = {
  text: {
    fontFamily,
    fontSize: "16px",
    lineHeight: "24px",
    color: colors.ink,
    margin: "0 0 12px",
    textTransform: "lowercase" as const,
  },
  soft: {
    fontFamily,
    fontSize: "14px",
    lineHeight: "20px",
    color: colors.inkSoft,
    margin: "0 0 8px",
    textTransform: "lowercase" as const,
  },
  h1: {
    fontFamily,
    fontSize: "28px",
    lineHeight: "34px",
    fontWeight: 600,
    color: colors.ink,
    margin: "0 0 16px",
    letterSpacing: "-0.01em",
    textTransform: "lowercase" as const,
  },
  marker: (tone: "blue" | "pink" = "blue") => ({
    backgroundColor: tone === "blue" ? colors.markerBlue : colors.markerPink,
    padding: "0 4px",
    borderRadius: "4px",
  }),
  button: {
    fontFamily,
    backgroundColor: colors.ink,
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 500,
    padding: "14px 24px",
    borderRadius: "999px",
    textDecoration: "none",
    display: "inline-block",
    textTransform: "lowercase" as const,
  },
};

/** base de todos los correos: blanco, inter, minúsculas, una carita en la esquina */
export function BaseEmail({ preview, appUrl, children }: BaseEmailProps) {
  return (
    <Html lang="es-CR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.bg, margin: 0, padding: "24px 0" }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "0 24px" }}>
          {children}
          <Section style={{ borderTop: `1px solid ${colors.line}`, marginTop: "32px", paddingTop: "16px" }}>
            <Text style={styles.soft}>
              ¿quién me tocó? es gratis. si te sirvió, pagame con un follow:{" "}
              <Link href={INSTAGRAM_URL} style={{ color: colors.ink, textDecoration: "underline" }}>
                {INSTAGRAM_HANDLE}
              </Link>
            </Text>
            <Text style={{ ...styles.soft, fontSize: "12px" }}>hecho por ear.dev · este correo se manda una sola vez.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
