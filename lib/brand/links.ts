export const INSTAGRAM_HANDLE = "@ear.dev";
export const INSTAGRAM_USERNAME = "ear.dev";
export const INSTAGRAM_URL = "https://www.instagram.com/ear.dev/";
export const INSTAGRAM_APP_URL = `instagram://user?username=${INSTAGRAM_USERNAME}`;

export const EXPLORER_BASE = "https://sepolia.voyager.online";

export function explorerTxUrl(hash: string) {
  return `${EXPLORER_BASE}/tx/${hash}`;
}

export function explorerContractUrl(address: string) {
  return `${EXPLORER_BASE}/contract/${address}`;
}

export function appUrl(path = "/") {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  return new URL(path, base).toString();
}
