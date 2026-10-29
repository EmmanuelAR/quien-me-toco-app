import "server-only";
import { findMemberByUser, getGroup } from "@/lib/db/groups";
import type { GroupRow, MemberRow } from "@/lib/db/types";

export type GroupAccess = {
  group: GroupRow;
  member: MemberRow | null;
  isOwner: boolean;
};

export async function loadGroupAccess(groupId: string, userId: string): Promise<GroupAccess | null> {
  const group = await getGroup(groupId);
  if (!group) return null;
  const member = await findMemberByUser(groupId, userId);
  const isOwner = group.owner_user_id === userId;
  // Owners keep access when archived (so they can unarchive). Members do not.
  if (group.archived && !isOwner) return null;
  if (!isOwner && !member) return null;
  return { group, member, isOwner };
}
