"use client";

import { createAuthClient } from "@neondatabase/auth/next";
import { QA_PERSONA_COOKIE, qaAuthBypassPublicEnabled } from "@/lib/auth/qa";

export const authClient = createAuthClient();

export function signInWithGoogle(callbackURL = "/dashboard") {
  if (qaAuthBypassPublicEnabled()) {
    // already treated as signed-in; just continue the flow
    if (typeof window !== "undefined") window.location.href = callbackURL;
    return Promise.resolve();
  }
  return authClient.signIn.social({
    provider: "google",
    callbackURL,
  });
}

export async function signOut(callbackURL = "/") {
  if (qaAuthBypassPublicEnabled()) {
    document.cookie = `${QA_PERSONA_COOKIE}=off; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
    window.location.href = callbackURL;
    return;
  }
  await authClient.signOut();
  window.location.href = callbackURL;
}

export async function setQaPersona(persona: "host" | "guest" | "off") {
  if (!qaAuthBypassPublicEnabled()) return;
  await fetch("/api/qa/persona", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ persona }),
  });
  window.location.reload();
}
