import "server-only";
import { Resend } from "resend";

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function mailFrom(): string {
  return process.env.RESEND_FROM?.trim() || "¿Quién me tocó? <onboarding@resend.dev>";
}

let client: Resend | null = null;

export function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}
