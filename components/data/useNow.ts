"use client";

import { useSyncExternalStore } from "react";

const STEP_MS = 30_000;

function subscribe(onChange: () => void) {
  const t = window.setInterval(onChange, STEP_MS);
  return () => window.clearInterval(t);
}

/** "ahora" en segundos unix, redondeado a 30 s para que sea estable entre renders; 0 en el servidor */
export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / STEP_MS) * (STEP_MS / 1000),
    () => 0,
  );
}
