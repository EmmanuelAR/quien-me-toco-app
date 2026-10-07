import { shortString, type Call, type RawArgs } from "starknet";
import { callData, getContractAddress } from "./client";
import type { Exclusion, Wishlist } from "./types";
import { bytesToBigInt } from "@/lib/crypto/random";

/**
 * constructores de llamadas. devuelven `Call` listos para `execute` de cavos
 * (usuarios) o para la cuenta del servidor (starknet.js).
 */
function call(entrypoint: string, args: RawArgs): Call {
  return {
    contractAddress: getContractAddress(),
    entrypoint,
    calldata: callData.compile(entrypoint, args),
  };
}

const wishlistArg = (w: Wishlist) => ({ ideas: w.ideas, sizes: w.sizes, links: w.links });

export interface CreateGroupArgs {
  name: string;
  eventAt: number;
  place: string;
  budgetMin: number;
  budgetMax: number;
  currency?: string;
  rules: string;
  expectedCount: number;
  inviteCode: bigint;
  previousGroupId?: bigint;
}

export const calls = {
  createGroup(a: CreateGroupArgs): Call {
    return call("create_group", {
      name: a.name,
      event_at: a.eventAt,
      place: a.place,
      budget_min: a.budgetMin,
      budget_max: a.budgetMax,
      currency: shortString.encodeShortString(a.currency ?? "CRC"),
      rules: a.rules,
      expected_count: a.expectedCount,
      invite_code: a.inviteCode,
      previous_group_id: a.previousGroupId ?? 0n,
    });
  },

  cloneGroup(previousGroupId: bigint, eventAt: number, inviteCode: bigint): Call {
    return call("clone_group", { previous_group_id: previousGroupId, event_at: eventAt, invite_code: inviteCode });
  },

  updateGroup(groupId: bigint, a: Omit<CreateGroupArgs, "expectedCount" | "inviteCode" | "previousGroupId" | "currency">): Call {
    return call("update_group", {
      group_id: groupId,
      name: a.name,
      event_at: a.eventAt,
      place: a.place,
      budget_min: a.budgetMin,
      budget_max: a.budgetMax,
      rules: a.rules,
    });
  },

  setExpectedCount(groupId: bigint, count: number): Call {
    return call("set_expected_count", { group_id: groupId, count });
  },
  closeRegistrations(groupId: bigint): Call {
    return call("close_registrations", { group_id: groupId });
  },
  reopenRegistrations(groupId: bigint): Call {
    return call("reopen_registrations", { group_id: groupId });
  },
  setExclusions(groupId: bigint, pairs: Exclusion[]): Call {
    return call("set_exclusions", { group_id: groupId, pairs: pairs.map((p) => ({ a: p.a, b: p.b })) });
  },
  setAvoidPrevious(groupId: bigint, enabled: boolean): Call {
    return call("set_avoid_previous", { group_id: groupId, enabled });
  },
  addGhost(groupId: bigint, name: string, wishlist: Wishlist): Call {
    return call("add_ghost", { group_id: groupId, name, wishlist: wishlistArg(wishlist) });
  },
  removeParticipant(groupId: bigint, index: number): Call {
    return call("remove_participant", { group_id: groupId, index });
  },
  requestDraw(groupId: bigint): Call {
    return call("request_draw", { group_id: groupId });
  },
  cancelDrawRequest(groupId: bigint): Call {
    return call("cancel_draw_request", { group_id: groupId });
  },
  requestReveal(groupId: bigint): Call {
    return call("request_reveal", { group_id: groupId });
  },
  setArchived(groupId: bigint, archived: boolean): Call {
    return call("set_archived", { group_id: groupId, archived });
  },

  join(groupId: bigint, inviteCode: bigint, name: string, encPubkey: Uint8Array, emailCommit: Uint8Array, wishlist: Wishlist): Call {
    return call("join", {
      group_id: groupId,
      invite_code: inviteCode,
      name,
      enc_pubkey: bytesToBigInt(encPubkey),
      email_commit: bytesToBigInt(emailCommit),
      wishlist: wishlistArg(wishlist),
    });
  },
  updateWishlist(groupId: bigint, index: number, wishlist: Wishlist): Call {
    return call("update_wishlist", { group_id: groupId, index, wishlist: wishlistArg(wishlist) });
  },
  rotateEncPubkey(groupId: bigint, index: number, newPubkey: Uint8Array): Call {
    return call("rotate_enc_pubkey", { group_id: groupId, index, new_pubkey: bytesToBigInt(newPubkey) });
  },

  publishDraw(groupId: bigint, commitments: bigint[], ciphertexts: Uint8Array[], sealedReveal: Uint8Array): Call {
    // posicional: la validación de starknet.js no acepta Array<ByteArray> con nombres,
    // pero la compilación posicional serializa cada Uint8Array como ByteArray binario.
    return {
      contractAddress: getContractAddress(),
      entrypoint: "publish_draw",
      calldata: callData.compile("publish_draw", [groupId, commitments, ciphertexts, sealedReveal]),
    };
  },
  updateCiphertext(groupId: bigint, index: number, ciphertext: Uint8Array): Call {
    return call("update_ciphertext", { group_id: groupId, index, ciphertext });
  },
  reveal(groupId: bigint, receivers: number[], salts: bigint[]): Call {
    return call("reveal", { group_id: groupId, receivers, salts });
  },
};

/** código de invitación aleatorio que cabe en un felt (lo lleva el link) */
export function newInviteCode(): bigint {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return bytesToBigInt(bytes) || 1n;
}

export function inviteCodeToSlug(code: bigint): string {
  return code.toString(36);
}

export function slugToInviteCode(slug: string): bigint | null {
  if (!/^[0-9a-z]+$/.test(slug)) return null;
  let v = 0n;
  for (const ch of slug) v = v * 36n + BigInt(parseInt(ch, 36));
  return v;
}
