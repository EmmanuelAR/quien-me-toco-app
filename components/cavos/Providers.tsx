"use client";

import type { ReactNode } from "react";
import { CavosProvider, type CavosConfig } from "@cavos/kit/react";
import { ToastProvider } from "@/components/ui/Toast";
import { CAVOS_APP_SALT, publicEnv } from "@/lib/env";

/**
 * configuración de cavos para starknet sepolia.
 * `network: "testnet"` es fijo a propósito: este proyecto no toca mainnet.
 */
export const cavosConfig: CavosConfig = {
  appId: publicEnv.cavosAppId || undefined,
  chains: ["starknet"],
  defaultChain: "starknet",
  network: "testnet",
  appSalt: CAVOS_APP_SALT,
  paymasterApiKey: publicEnv.cavosPaymasterApiKey || undefined,
  rpcUrls: { starknet: publicEnv.rpcUrl },
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CavosProvider config={cavosConfig}>
      <ToastProvider>{children}</ToastProvider>
    </CavosProvider>
  );
}
