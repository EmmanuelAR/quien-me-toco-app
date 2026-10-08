/**
 * Fixes mojibake caused by UTF-8 bytes being incorrectly decoded as Latin-1/ISO-8859-1.
 *
 * When a JWT payload containing UTF-8 text is decoded with atob() and JSON.parse()
 * without proper UTF-8 handling, characters like "ü" (UTF-8: 0xC3 0xBC) get
 * interpreted as "Ã¼" (Latin-1: 0xC3 0xBC as two separate characters).
 *
 * This function detects such corruption and attempts to recover the original text.
 *
 * @example
 * fixMojibake("Emmanuel AgÃ¼ero Rojas") // "Emmanuel Agüero Rojas"
 * fixMojibake("José NÃºÃ±ez") // "José Núñez"
 */
export function fixMojibake(s?: string | null): string {
  if (!s) return "";

  const hasMojibakePattern = /[\u00C0-\u00FF]/.test(s);
  if (!hasMojibakePattern) return s;

  const allLatin1 = ![...s].some((c) => c.charCodeAt(0) > 255);
  if (!allLatin1) return s;

  try {
    const bytes = Uint8Array.from(s, (c) => c.charCodeAt(0));
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return decoded;
  } catch {
    return s;
  }
}
