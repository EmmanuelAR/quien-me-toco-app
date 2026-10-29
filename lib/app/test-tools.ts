import "server-only";

/**
 * Herramientas solo para desarrollo / preview de Vercel.
 * Nunca en production (VERCEL_ENV === "production").
 */
export function testToolsEnabled(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.NODE_ENV === "development") return true;
  if (process.env.VERCEL_ENV === "preview") return true;
  return process.env.ENABLE_TEST_TOOLS === "1";
}
