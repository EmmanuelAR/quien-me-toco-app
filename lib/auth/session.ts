"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";
import {
  QA_PERSONA_COOKIE,
  QA_USERS,
  parseQaPersona,
  qaAuthBypassPublicEnabled,
  type QaPersona,
  type QaUser,
} from "@/lib/auth/qa";

type SessionData = { user: QaUser } | null;

const BYPASS = qaAuthBypassPublicEnabled();

function readPersonaCookie(): QaPersona {
  if (typeof document === "undefined") return "host";
  const match = document.cookie.match(new RegExp(`(?:^|; )${QA_PERSONA_COOKIE}=([^;]*)`));
  return parseQaPersona(match?.[1] ? decodeURIComponent(match[1]) : null);
}

function useQaSession() {
  const [persona, setPersona] = useState<QaPersona>("host");
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setPersona(readPersonaCookie());
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const user = persona === "off" ? null : QA_USERS[persona];
  const data: SessionData = user ? { user } : null;

  return {
    data,
    isPending: !ready,
    error: null,
    refetch: refresh,
  };
}

export function useSession() {
  const qa = useQaSession();
  const real = authClient.useSession();
  return BYPASS ? qa : real;
}
