import "server-only";

/**
 * Herramientas de QA (agregar personas de prueba sin Google).
 * - Siempre en development / preview de Vercel.
 * - En production solo si ENABLE_TEST_TOOLS=1 (opt-in explícito).
 */
export function testToolsEnabled(): boolean {
  if (process.env.ENABLE_TEST_TOOLS === "1") return true;
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.NODE_ENV === "development") return true;
  if (process.env.VERCEL_ENV === "preview") return true;
  return false;
}
