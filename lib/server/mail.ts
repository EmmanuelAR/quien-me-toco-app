import "server-only";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { createElement } from "react";
import { TeToco, type TeTocoProps } from "@/emails/TeToco";
import { serverEnv } from "./env";

export type MailOutcome =
  | { ok: true; id: string | null }
  | { ok: false; reason: "tomorrow" | "failed" | "not-configured"; error: string };

let client: Resend | null = null;
function resend(): Resend | null {
  if (!serverEnv.resendApiKey) return null;
  if (!client) client = new Resend(serverEnv.resendApiKey);
  return client;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface SendTeTocoInput extends TeTocoProps {
  to: string;
  idempotencyKey: string;
  ics?: string;
}

/**
 * manda "te tocó…" con reintentos (3, con espera creciente). el plan gratis de resend
 * da 100 correos al día: si llegamos al tope, devolvemos "tomorrow" para que el panel
 * lo muestre y la admin reintente al día siguiente.
 */
export async function sendTeToco(input: SendTeTocoInput): Promise<MailOutcome> {
  const api = resend();
  if (!api) return { ok: false, reason: "not-configured", error: "falta RESEND_API_KEY" };

  const { to, idempotencyKey, ics, ...props } = input;
  const element = createElement(TeToco, props);
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);

  let lastError = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data, error } = await api.emails.send(
      {
        from: serverEnv.resendFrom,
        to,
        subject: `${props.giverName}, ya sabemos quién te tocó`,
        html,
        text,
        attachments: ics
          ? [{ filename: "intercambio.ics", content: Buffer.from(ics, "utf8").toString("base64"), contentType: "text/calendar" }]
          : undefined,
      },
      { idempotencyKey },
    );
    if (!error) return { ok: true, id: data?.id ?? null };

    lastError = `${error.name}: ${error.message}`;
    if (error.name === "daily_quota_exceeded" || /quota/i.test(error.message)) {
      return { ok: false, reason: "tomorrow", error: lastError };
    }
    if (error.name === "validation_error" || error.name === "invalid_from_address" || /invalid/i.test(error.name)) {
      break; // reintentar no ayuda
    }
    await sleep(600 * attempt * attempt);
  }
  return { ok: false, reason: "failed", error: lastError };
}
