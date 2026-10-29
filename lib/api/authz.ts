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
  if (!group || group.archived) return null;
  const member = await findMemberByUser(groupId, userId);
  const isOwner = group.owner_user_id === userId;
  if (!isOwner && !member) return null;
  return { group, member, isOwner };
}
