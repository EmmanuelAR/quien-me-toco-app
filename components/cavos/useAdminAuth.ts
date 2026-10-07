"use client";

import { useCallback } from "react";
import { useCavos } from "@cavos/kit/react";
import { buildAuthMessage, type AdminAction, type AdminAuthPayload } from "@/lib/auth/message";
import { bytesToHex } from "@/lib/crypto/random";

/**
 * firma silenciosa con la llave de dispositivo de cavos para las rutas de solo-admin.
 * no abre ninguna ui ni cuesta gas; el servidor comprueba firma y cuenta.
 */
export function useAdminAuth() {
  const { signMessage, address } = useCavos();

  const authHeader = useCallback(
    async (action: AdminAction, groupId: bigint): Promise<string> => {
      if (!address) throw new Error("sin sesión");
      const message = buildAuthMessage(action, groupId);
      const sig = await signMessage(message);
      // starknet: "04‖x‖y" en hex (sin comprimir)
      const publicKey = sig.publicKey.replace(/^0x/, "");
      const payload: AdminAuthPayload = {
        address,
        message,
        signature: bytesToHex(sig.signature),
        publicKey,
      };
      return btoa(JSON.stringify(payload));
    },
    [address, signMessage],
  );

  const adminFetch = useCallback(
    async <T,>(action: AdminAction, groupId: bigint, url: string, init: RequestInit = {}): Promise<T> => {
      const header = await authHeader(action, groupId);
      const res = await fetch(url, { ...init, headers: { ...(init.headers ?? {}), "x-qmt-auth": header } });
      const body = (await res.json().catch(() => ({}))) as T & { error?: string };
      if (!res.ok) throw new Error(body.error ?? `error ${res.status}`);
      return body;
    },
    [authHeader],
  );

  return { authHeader, adminFetch };
}
