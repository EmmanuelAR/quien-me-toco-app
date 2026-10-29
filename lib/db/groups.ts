import "server-only";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import type { AssignmentRow, ExclusionRow, GroupRow, GroupStatus, MemberRow } from "@/lib/db/types";
import { MIN_PARTICIPANTS, assign } from "@/lib/draw/assign";

export const OPEN_JOIN_CAP = 200;

export function newInviteToken() {
  return randomBytes(16).toString("base64url");
}

export function purgeAfterFromEvent(eventAt: Date) {
  const d = new Date(eventAt);
  d.setDate(d.getDate() + 7);
  return d;
}

export async function listMyGroups(userId: string): Promise<Array<GroupRow & { role: "owner" | "member" | "both" }>> {
  const sql = db();
  const rows = await sql`
    select g.*,
      (g.owner_user_id = ${userId}) as is_owner,
      exists(
        select 1 from members m
        where m.group_id = g.id and m.user_id = ${userId}
      ) as is_member
    from groups g
    where g.owner_user_id = ${userId}
       or exists (select 1 from members m where m.group_id = g.id and m.user_id = ${userId})
    order by g.event_at desc
  `;
  return (rows as Array<GroupRow & { is_owner: boolean; is_member: boolean }>).map((r) => ({
    ...r,
    role: r.is_owner && r.is_member ? "both" : r.is_owner ? "owner" : "member",
  }));
}

export async function getGroup(id: string): Promise<GroupRow | null> {
  const rows = await db()`select * from groups where id = ${id} limit 1`;
  return (rows[0] as GroupRow) ?? null;
}

export async function getGroupByInvite(token: string): Promise<GroupRow | null> {
  const rows = await db()`select * from groups where invite_token = ${token} limit 1`;
  return (rows[0] as GroupRow) ?? null;
}

export async function createGroup(input: {
  name: string;
  eventAt: Date;
  place: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  rules: string;
  ownerUserId: string;
  ownerName: string;
  ownerEmail: string | null;
}): Promise<GroupRow> {
  const sql = db();
  const token = newInviteToken();
  const purge = purgeAfterFromEvent(input.eventAt);
  const groups = await sql`
    insert into groups (
      name, event_at, place, budget_min, budget_max, currency, rules,
      status, owner_user_id, invite_token, purge_after
    ) values (
      ${input.name}, ${input.eventAt.toISOString()}, ${input.place},
      ${input.budgetMin}, ${input.budgetMax}, ${input.currency}, ${input.rules},
      'open', ${input.ownerUserId}, ${token}, ${purge.toISOString()}
    )
    returning *
  `;
  const group = groups[0] as GroupRow;
  await sql`
    insert into members (group_id, user_id, name, email)
    values (${group.id}, ${input.ownerUserId}, ${input.ownerName}, ${input.ownerEmail})
  `;
  return group;
}

export async function updateGroup(
  id: string,
  patch: Partial<{
    name: string;
    eventAt: Date;
    place: string;
    budgetMin: number;
    budgetMax: number;
    currency: string;
    rules: string;
    status: GroupStatus;
    archived: boolean;
  }>,
): Promise<GroupRow | null> {
  const current = await getGroup(id);
  if (!current) return null;
  const name = patch.name ?? current.name;
  const eventAt = patch.eventAt ?? new Date(current.event_at);
  const place = patch.place ?? current.place;
  const budgetMin = patch.budgetMin ?? current.budget_min;
  const budgetMax = patch.budgetMax ?? current.budget_max;
  const currency = patch.currency ?? current.currency;
  const rules = patch.rules ?? current.rules;
  const status = patch.status ?? current.status;
  const archived = patch.archived ?? current.archived;
  const purge = purgeAfterFromEvent(eventAt);
  const rows = await db()`
    update groups set
      name = ${name},
      event_at = ${eventAt.toISOString()},
      place = ${place},
      budget_min = ${budgetMin},
      budget_max = ${budgetMax},
      currency = ${currency},
      rules = ${rules},
      status = ${status},
      archived = ${archived},
      purge_after = ${purge.toISOString()}
    where id = ${id}
    returning *
  `;
  return (rows[0] as GroupRow) ?? null;
}

export async function listMembers(groupId: string): Promise<MemberRow[]> {
  const rows = await db()`
    select * from members where group_id = ${groupId} order by created_at asc
  `;
  return rows as MemberRow[];
}

export async function getMember(id: string): Promise<MemberRow | null> {
  const rows = await db()`select * from members where id = ${id} limit 1`;
  return (rows[0] as MemberRow) ?? null;
}

export async function findMemberByUser(groupId: string, userId: string): Promise<MemberRow | null> {
  const rows = await db()`
    select * from members where group_id = ${groupId} and user_id = ${userId} limit 1
  `;
  return (rows[0] as MemberRow) ?? null;
}

export async function addMember(input: {
  groupId: string;
  userId: string | null;
  name: string;
  email: string | null;
  wishlist?: { ideas?: string; sizes?: string; links?: string };
}): Promise<MemberRow> {
  const rows = await db()`
    insert into members (
      group_id, user_id, name, email,
      wishlist_ideas, wishlist_sizes, wishlist_links
    ) values (
      ${input.groupId}, ${input.userId}, ${input.name}, ${input.email},
      ${input.wishlist?.ideas ?? ""}, ${input.wishlist?.sizes ?? ""}, ${input.wishlist?.links ?? ""}
    )
    returning *
  `;
  return rows[0] as MemberRow;
}

const TEST_PEOPLE = [
  {
    name: "Ana Prueba",
    email: "ana.prueba@example.invalid",
    wishlist: { ideas: "Libro o planta chiquita", sizes: "M", links: "" },
  },
  {
    name: "Bruno Prueba",
    email: "bruno.prueba@example.invalid",
    wishlist: { ideas: "Café bueno o calcetines raros", sizes: "L", links: "" },
  },
  {
    name: "Carla Prueba",
    email: "carla.prueba@example.invalid",
    wishlist: { ideas: "Algo para la cocina", sizes: "S", links: "" },
  },
] as const;

/** agrega personas sin cuenta Google (user_id null). solo usar detrás de testToolsEnabled. */
export async function addTestMembers(
  groupId: string,
  count = 2,
): Promise<{ added: MemberRow[]; total: number }> {
  const existing = await listMembers(groupId);
  if (existing.length >= OPEN_JOIN_CAP) {
    return { added: [], total: existing.length };
  }

  const used = new Set(existing.map((m) => m.name.toLowerCase()));
  const pool = TEST_PEOPLE.filter((p) => !used.has(p.name.toLowerCase()));
  const room = OPEN_JOIN_CAP - existing.length;
  const n = Math.min(Math.max(0, count), room, pool.length);
  const added: MemberRow[] = [];

  for (let i = 0; i < n; i++) {
    const p = pool[i];
    added.push(
      await addMember({
        groupId,
        userId: null,
        name: p.name,
        email: p.email,
        wishlist: p.wishlist,
      }),
    );
  }

  return { added, total: existing.length + added.length };
}

export async function removeMember(id: string) {
  await db()`delete from members where id = ${id}`;
}

export async function updateWishlist(
  memberId: string,
  wishlist: { ideas: string; sizes: string; links: string },
): Promise<MemberRow | null> {
  const rows = await db()`
    update members set
      wishlist_ideas = ${wishlist.ideas},
      wishlist_sizes = ${wishlist.sizes},
      wishlist_links = ${wishlist.links}
    where id = ${memberId}
    returning *
  `;
  return (rows[0] as MemberRow) ?? null;
}

export async function listExclusions(groupId: string): Promise<ExclusionRow[]> {
  return (await db()`select * from exclusions where group_id = ${groupId}`) as ExclusionRow[];
}

export async function setExclusions(groupId: string, pairs: Array<{ aId: string; bId: string }>) {
  const sql = db();
  await sql`delete from exclusions where group_id = ${groupId}`;
  for (const p of pairs) {
    const [a, b] = p.aId < p.bId ? [p.aId, p.bId] : [p.bId, p.aId];
    await sql`
      insert into exclusions (group_id, a_id, b_id)
      values (${groupId}, ${a}, ${b})
      on conflict do nothing
    `;
  }
}

export async function listAssignments(groupId: string): Promise<AssignmentRow[]> {
  return (await db()`select * from assignments where group_id = ${groupId}`) as AssignmentRow[];
}

export async function getAssignmentForGiver(groupId: string, giverId: string): Promise<AssignmentRow | null> {
  const rows = await db()`
    select * from assignments where group_id = ${groupId} and giver_id = ${giverId} limit 1
  `;
  return (rows[0] as AssignmentRow) ?? null;
}

export async function runDraw(groupId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const group = await getGroup(groupId);
  if (!group) return { ok: false, error: "not_found" };
  if (group.status !== "open" && group.status !== "closed") return { ok: false, error: "locked" };

  const members = await listMembers(groupId);
  if (members.length < MIN_PARTICIPANTS) return { ok: false, error: "too_few" };

  const exclusions = await listExclusions(groupId);
  const indexById = new Map(members.map((m, i) => [m.id, i]));
  const pairs: Array<[number, number]> = [];
  for (const e of exclusions) {
    const a = indexById.get(e.a_id);
    const b = indexById.get(e.b_id);
    if (a === undefined || b === undefined) continue;
    pairs.push([a, b]);
  }

  const receivers = assign({ n: members.length, pairs });
  if (!receivers) return { ok: false, error: "infeasible" };

  const sql = db();
  await sql`delete from assignments where group_id = ${groupId}`;
  for (let i = 0; i < members.length; i++) {
    await sql`
      insert into assignments (group_id, giver_id, receiver_id)
      values (${groupId}, ${members[i].id}, ${members[receivers[i]].id})
    `;
  }
  await sql`update groups set status = 'drawn' where id = ${groupId}`;
  return { ok: true };
}

export async function purgeExpiredGroups() {
  await db()`delete from groups where purge_after < now()`;
}
