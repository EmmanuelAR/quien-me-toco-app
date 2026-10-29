"use client";

import { createAuthClient } from "@neondatabase/auth/next";

export const authClient = createAuthClient();

export function signInWithGoogle(callbackURL = "/dashboard") {
  return authClient.signIn.social({
    provider: "google",
    callbackURL,
  });
}

export async function signOut(callbackURL = "/") {
  await authClient.signOut();
  window.location.href = callbackURL;
}
