/** variables públicas */

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export const AUTH_CALLBACK_PATH = "/auth/callback";
