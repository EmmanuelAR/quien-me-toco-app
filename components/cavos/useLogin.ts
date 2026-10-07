"use client";

import { useCallback, useMemo, useState } from "react";
import { CavosAuth } from "@cavos/kit";
import { useCavos } from "@cavos/kit/react";
import { AUTH_CALLBACK_PATH, publicEnv } from "@/lib/env";

const RETURN_KEY = "qmt:return-to";

/**
 * login con google o apple por redirección, siempre volviendo a /auth/callback.
 * el `login()` del kit vuelve a la página actual, lo que obligaría a registrar cada
 * url de invitación en el dashboard de cavos; con un callback fijo basta con una.
 */
export function useLogin() {
  const { isAuthenticated, isLoading, address, user, logout, authError, clearAuthError } = useCavos();
  const [starting, setStarting] = useState<"google" | "apple" | null>(null);
  const auth = useMemo(() => new CavosAuth({ appId: publicEnv.cavosAppId || undefined }), []);

  const login = useCallback(
    async (provider: "google" | "apple") => {
      if (typeof window === "undefined") return;
      setStarting(provider);
      clearAuthError();
      try {
        sessionStorage.setItem(RETURN_KEY, window.location.pathname + window.location.search);
        const redirectUri = `${window.location.origin}${AUTH_CALLBACK_PATH}`;
        const url =
          provider === "google"
            ? await auth.getGoogleOAuthUrl(redirectUri)
            : await auth.getAppleOAuthUrl(redirectUri);
        window.location.href = url;
      } catch (e) {
        setStarting(null);
        throw e;
      }
    },
    [auth, clearAuthError],
  );

  return { login, starting, isAuthenticated, isLoading, address, user, logout, authError };
}

/** a dónde volver después del callback (y limpia) */
export function takeReturnPath(): string {
  if (typeof window === "undefined") return "/";
  const v = sessionStorage.getItem(RETURN_KEY);
  sessionStorage.removeItem(RETURN_KEY);
  return v && v.startsWith("/") && !v.startsWith(AUTH_CALLBACK_PATH) ? v : "/";
}
