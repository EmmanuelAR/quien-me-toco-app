/**
 * Client-side storage for invite codes with server backup.
 * 
 * Since invite codes are now stored as hashes in the contract (for security),
 * we keep the plain codes:
 * 1. In localStorage for quick access
 * 2. On the server (encrypted in KV) for recovery from other devices
 * 
 * Flow:
 * 1. When creating a group, store locally AND via API
 * 2. Admin page tries localStorage first, then API if needed
 * 3. If both fail, show a message that the link can't be recovered
 */

const STORAGE_KEY_PREFIX = "qmt:invite:";

export function storeInviteCodeLocally(groupId: bigint, inviteCode: bigint): void {
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

/**
 * Store invite code both locally and on server.
 * Server storage requires admin authentication via authHeader.
 */
export async function storeInviteCode(
  groupId: bigint,
  inviteCode: bigint,
  authHeader: string
): Promise<void> {
  storeInviteCodeLocally(groupId, inviteCode);
  
  try {
    await fetch(`/api/groups/${groupId}/invite-code`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-qmt-auth": authHeader },
      body: JSON.stringify({ inviteCode: inviteCode.toString() }),
    });
  } catch {
    // Server storage failed, but local is ok
  }
}

/**
 * Fetch invite code from server (for recovery on different devices).
 * Requires admin authentication via authHeader.
 */
export async function fetchInviteCodeFromServer(
  groupId: bigint,
  authHeader: string
): Promise<bigint | null> {
  try {
    const res = await fetch(`/api/groups/${groupId}/invite-code`, {
      headers: { "x-qmt-auth": authHeader },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const code = BigInt(data.inviteCode);
    storeInviteCodeLocally(groupId, code);
    return code;
  } catch {
    return null;
  }
}
