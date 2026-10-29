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

function normEmail(email: string | null | undefined): string | null {
  const e = email?.trim().toLowerCase();
  return e || null;
}

function normName(name: string): string {
  return name.trim().toLowerCase();
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
  fromGroupId?: string | null;
  cloneMembers?: boolean;
  avoidPrevious?: boolean;
}): Promise<GroupRow> {
  const sql = db();
  const token = newInviteToken();
  const purge = purgeAfterFromEvent(input.eventAt);
  const fromId = input.fromGroupId ?? null;
  const avoidPrevious = input.avoidPrevious !== false;
  const groups = await sql`
    insert into groups (
      name, event_at, place, budget_min, budget_max, currency, rules,
      status, owner_user_id, invite_token, purge_after,
      source_group_id, avoid_previous
    ) values (
      ${input.name}, ${input.eventAt.toISOString()}, ${input.place},
      ${input.budgetMin}, ${input.budgetMax}, ${input.currency}, ${input.rules},
      'open', ${input.ownerUserId}, ${token}, ${purge.toISOString()},
      ${fromId}, ${avoidPrevious}
    )
    returning *
  `;
  const group = groups[0] as GroupRow;
  await sql`
    insert into members (group_id, user_id, name, email)
    values (${group.id}, ${input.ownerUserId}, ${input.ownerName}, ${input.ownerEmail})
  `;

  if (fromId && input.cloneMembers !== false) {
    const source = await getGroup(fromId);
    if (source && source.owner_user_id === input.ownerUserId) {
      const [sourceMembers, sourceExclusions] = await Promise.all([
        listMembers(fromId),
        listExclusions(fromId),
      ]);
      const idMap = new Map<string, string>();
      const ownerSource =
        sourceMembers.find((m) => m.user_id === source.owner_user_id) ?? sourceMembers[0];
      const newOwner = (await listMembers(group.id))[0];
      if (ownerSource && newOwner) idMap.set(ownerSource.id, newOwner.id);

      for (const m of sourceMembers) {
        if (ownerSource && m.id === ownerSource.id) continue;
        const email = normEmail(m.email);
        if (email && email === normEmail(input.ownerEmail)) continue;
        const created = await addMember({
          groupId: group.id,
          userId: null,
          name: m.name,
          email: m.email,
          wishlist: {
            ideas: m.wishlist_ideas,
            sizes: m.wishlist_sizes,
            links: m.wishlist_links,
          },
        });
        idMap.set(m.id, created.id);
      }

      const pairs = sourceExclusions
        .map((e) => {
          const aId = idMap.get(e.a_id);
          const bId = idMap.get(e.b_id);
          if (!aId || !bId || aId === bId) return null;
          return { aId, bId };
        })
        .filter((p): p is { aId: string; bId: string } => Boolean(p));
      if (pairs.length) await setExclusions(group.id, pairs);
    }
  }

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
    avoidPrevious: boolean;
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
  const avoidPrevious = patch.avoidPrevious ?? current.avoid_previous ?? true;
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
      avoid_previous = ${avoidPrevious},
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

/** asiento clonado sin Google: se reclama al entrar con el mismo correo */
export async function findClaimableMemberByEmail(
  groupId: string,
  email: string,
): Promise<MemberRow | null> {
  const e = normEmail(email);
  if (!e) return null;
  const rows = await db()`
    select * from members
    where group_id = ${groupId} and user_id is null and lower(email) = ${e}
    limit 1
  `;
  return (rows[0] as MemberRow) ?? null;
}

export async function claimMember(
  memberId: string,
  userId: string,
  name: string,
  email: string | null,
): Promise<MemberRow | null> {
  const rows = await db()`
    update members set
      user_id = ${userId},
      name = ${name},
      email = ${email}
    where id = ${memberId} and user_id is null
    returning *
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

/** previous[i] = índice del receptor del año pasado para members[i], o null */
export async function previousReceiversForGroup(
  group: GroupRow,
  members: MemberRow[],
): Promise<Array<number | null> | undefined> {
  if (group.avoid_previous === false || !group.source_group_id) return undefined;
  const source = await getGroup(group.source_group_id);
  if (!source) return undefined;
  const [oldMembers, oldAssignments] = await Promise.all([
    listMembers(source.id),
    listAssignments(source.id),
  ]);
  if (!oldAssignments.length) return undefined;

  const oldById = new Map(oldMembers.map((m) => [m.id, m]));
  const newIndexByKey = new Map<string, number>();
  members.forEach((m, i) => {
    const email = normEmail(m.email);
    if (email) newIndexByKey.set(`e:${email}`, i);
    newIndexByKey.set(`n:${normName(m.name)}`, i);
    if (m.user_id === group.owner_user_id) newIndexByKey.set("owner", i);
  });

  const oldIndexToNew = new Map<string, number>();
  for (const om of oldMembers) {
    const email = normEmail(om.email);
    let idx: number | undefined;
    if (om.user_id === source.owner_user_id) idx = newIndexByKey.get("owner");
    if (idx === undefined && email) idx = newIndexByKey.get(`e:${email}`);
    if (idx === undefined) idx = newIndexByKey.get(`n:${normName(om.name)}`);
    if (idx !== undefined) oldIndexToNew.set(om.id, idx);
  }

  const previous: Array<number | null> = members.map(() => null);
  for (const a of oldAssignments) {
    const giverNew = oldIndexToNew.get(a.giver_id);
    const receiverOld = oldById.get(a.receiver_id);
    if (giverNew === undefined || !receiverOld) continue;
    const email = normEmail(receiverOld.email);
    let recv =
      (receiverOld.user_id === source.owner_user_id ? newIndexByKey.get("owner") : undefined) ??
      (email ? newIndexByKey.get(`e:${email}`) : undefined) ??
      newIndexByKey.get(`n:${normName(receiverOld.name)}`);
    if (recv === undefined) continue;
    previous[giverNew] = recv;
  }
  return previous.some((p) => p !== null) ? previous : undefined;
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

  const previous = await previousReceiversForGroup(group, members);
  const receivers = assign({ n: members.length, pairs, previous });
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

/** grupos drawn/revealed con evento en las próximas ~36h y sin reminder */
export async function listGroupsNeedingReminder(now = new Date()): Promise<GroupRow[]> {
  const from = now.toISOString();
  const to = new Date(now.getTime() + 36 * 60 * 60 * 1000).toISOString();
  const rows = await db()`
    select * from groups
    where archived = false
      and reminder_sent_at is null
      and status in ('drawn', 'revealed')
      and event_at >= ${from}
      and event_at <= ${to}
    order by event_at asc
    limit 50
  `;
  return rows as GroupRow[];
}

export async function markReminderSent(groupId: string) {
  await db()`update groups set reminder_sent_at = now() where id = ${groupId}`;
}
