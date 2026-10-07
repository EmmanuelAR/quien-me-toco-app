/** variables públicas (NEXT_PUBLIC_*) con sus valores por defecto para sepolia */

export const SEPOLIA_RPC_FALLBACK = "https://api.zan.top/public/starknet-sepolia/rpc/v0_10";

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  cavosAppId: process.env.NEXT_PUBLIC_CAVOS_APP_ID ?? "",
  cavosPaymasterApiKey: process.env.NEXT_PUBLIC_CAVOS_PAYMASTER_API_KEY ?? "",
  rpcUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL ?? SEPOLIA_RPC_FALLBACK,
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "",
  serverEncPubkey: process.env.NEXT_PUBLIC_SERVER_ENC_PUBKEY ?? "",
} as const;

/** sal fija de cavos: si cambia, cada usuario cae en una wallet nueva y vacía */
export const CAVOS_APP_SALT = "quien-me-toco";

export const AUTH_CALLBACK_PATH = "/auth/callback";
