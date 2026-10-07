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
    fontSize: "17px",
    lineHeight: "25px",
    color: colors.ink,
    margin: "0 0 12px",
  },
  soft: {
    fontFamily,
    fontSize: "14px",
    lineHeight: "20px",
    color: colors.inkSoft,
    margin: "0 0 6px",
  },
  label: {
    fontFamily,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    color: colors.ink,
    margin: "0 0 6px",
  },
  h1: {
    fontFamily,
    fontSize: "32px",
    lineHeight: "38px",
    fontWeight: 600,
    color: colors.ink,
    margin: "0 0 16px",
  },
  button: {
    fontFamily,
    backgroundColor: colors.ink,
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: 500,
    padding: "16px 28px",
    borderRadius: "999px",
    textDecoration: "none",
    display: "inline-block",
  },
};

/** base de todos los correos: blanco, letra del sistema y un pie con el follow */
export function BaseEmail({ preview, appUrl, children }: BaseEmailProps) {
  return (
    <Html lang="es-CR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.bg, margin: 0, padding: "32px 0" }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "0 24px" }}>
          {children}
          <Section style={{ borderTop: `1px solid ${colors.line}`, marginTop: "40px", paddingTop: "16px" }}>
            <Text style={styles.soft}>
              ¿Quién me tocó? es gratis. Si te sirvió, pagame con un follow:{" "}
              <Link href={INSTAGRAM_URL} style={{ color: colors.link, textDecoration: "none" }}>
                {INSTAGRAM_HANDLE}
              </Link>
            </Text>
            <Text style={{ ...styles.soft, fontSize: "12px" }}>Hecho por ear.dev. Este correo se manda una sola vez.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
