/**
 * Client-side storage for invite codes.
 * 
 * Since invite codes are now stored as hashes in the contract (for security),
 * we need to keep the plain codes client-side for the admin to share invite links.
 * 
 * Flow:
 * 1. When creating a group, the invite code is generated and stored here
 * 2. The admin page retrieves the code to build share links
 * 3. If the code is lost (different browser/cleared storage), the admin can't share links
 *    but the group still works - existing invite links remain valid
 */

const STORAGE_KEY_PREFIX = "qmt:invite:";

export function storeInviteCode(groupId: bigint, inviteCode: bigint): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${groupId}`, inviteCode.toString());
  } catch {
    // localStorage might be full or disabled
  }
}

export function getStoredInviteCode(groupId: bigint): bigint | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${groupId}`);
    if (stored) {
      return BigInt(stored);
    }
  } catch {
    // Invalid data or localStorage disabled
  }
  return null;
}

export function removeStoredInviteCode(groupId: bigint): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${groupId}`);
  } catch {
    // localStorage might be disabled
  }
}
