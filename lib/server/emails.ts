import "server-only";
import { keys, kv, ttlForEvent } from "./kv";
import { sendTeToco } from "./mail";
import { serverEnv } from "./env";
import { readGroup, readParticipants } from "@/lib/contract/reads";
import { GroupStatus, type Group, type Participant } from "@/lib/contract/types";
import { verifyEmailCommit } from "@/lib/crypto/email";
import { buildIcs } from "@/lib/calendar";
import { formatBudget, formatDate } from "@/lib/format";
import { decodeRevealPackage } from "@/lib/crypto/commitments";
import { open, revealAad } from "@/lib/crypto/sealedbox";
import { readSealedReveal } from "@/lib/contract/reads";

export interface StoredEmail {
  email: string;
  nonce: string;
}

export type MailStatus = "pending" | "sent" | "failed" | "tomorrow" | "unverified" | "missing" | "ghost";

export interface MailRecord {
  status: MailStatus;
  attempts: number;
  updatedAt: number;
  error?: string;
  resendId?: string | null;
}

export async function storeEmail(group: Group, account: string, email: string, nonce: string): Promise<void> {
  await kv().set(keys.email(group.id, account), { email, nonce } satisfies StoredEmail, { ex: ttlForEvent(group.eventAt) });
}

export async function getMailRecords(groupId: bigint, count: number): Promise<MailRecord[]> {
  const store = kv();
  const out: MailRecord[] = [];
  for (let i = 0; i < count; i++) {
    out.push((await store.get<MailRecord>(keys.mail(groupId, i))) ?? { status: "pending", attempts: 0, updatedAt: 0 });
  }
  return out;
}

export interface EmailSummary {
  total: number;
  sent: number;
  tomorrow: number;
  failed: number;
  pending: number;
  records: Array<{ index: number; name: string } & MailRecord>;
}

export async function emailSummary(group: Group, participants: Participant[]): Promise<EmailSummary> {
  const records = await getMailRecords(group.id, participants.length);
  const rows = participants.map((p, i) => ({ index: i, name: p.name, ...(p.isGhost ? { status: "ghost" as const, attempts: 0, updatedAt: 0 } : records[i]) }));
  const accounts = rows.filter((r) => r.status !== "ghost");
  return {
    total: accounts.length,
    sent: accounts.filter((r) => r.status === "sent").length,
    tomorrow: accounts.filter((r) => r.status === "tomorrow").length,
    failed: accounts.filter((r) => r.status === "failed" || r.status === "unverified" || r.status === "missing").length,
    pending: accounts.filter((r) => r.status === "pending").length,
    records: rows,
  };
}

/** abre el paquete de revelación con la llave del servidor (solo aquí y en los workers) */
export async function openRevealPackage(groupId: bigint) {
  const sealed = await readSealedReveal(groupId);
  if (sealed.length === 0) throw new Error("el grupo no tiene sorteo publicado");
  return decodeRevealPackage(open(serverEnv.encSecretKey, sealed, revealAad(groupId)));
}

/**
 * manda (o reintenta) los correos "te tocó…" de un grupo ya sorteado.
 * idempotente: salta los ya enviados. devuelve el resumen actualizado.
 */
export async function sendDrawEmails(groupId: bigint, opts: { force?: boolean } = {}): Promise<EmailSummary> {
  const group = await readGroup(groupId);
  if (group.status < GroupStatus.Drawn) throw new Error("todavía no hay sorteo");
  const participants = await readParticipants(groupId);
  const records = await getMailRecords(groupId, participants.length);
  const pkg = await openRevealPackage(groupId);
  const store = kv();
  const ttl = ttlForEvent(group.eventAt);
  const appUrl = serverEnv.appUrl;
  const groupUrl = `${appUrl}/g/${groupId.toString()}`;
  const when = formatDate(group.eventAt, { withTime: true, timeZone: "America/Costa_Rica" });
  const budget = formatBudget(group.budgetMin, group.budgetMax, group.currency || "CRC");
  const ics = buildIcs({
    groupId,
    name: group.name,
    eventAt: group.eventAt,
    place: group.place,
    budgetMin: group.budgetMin,
    budgetMax: group.budgetMax,
    currency: group.currency || "CRC",
    url: groupUrl,
  });

  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];
    if (p.isGhost) continue;
    const prev = records[i];
    if (prev.status === "sent" && !opts.force) continue;

    const save = (rec: Partial<MailRecord>) =>
      store.set(keys.mail(groupId, i), { ...prev, ...rec, updatedAt: Date.now() } satisfies MailRecord, { ex: ttl });

    const stored = await store.get<StoredEmail>(keys.email(groupId, p.account));
    if (!stored) {
      await save({ status: "missing", error: "sin correo guardado" });
      continue;
    }
    if (!verifyEmailCommit(stored.email, stored.nonce, p.emailCommit)) {
      await save({ status: "unverified", error: "el correo no coincide con lo registrado" });
      continue;
    }

    const receiver = participants[pkg.receivers[i]];
    const outcome = await sendTeToco({
      to: stored.email,
      idempotencyKey: `qmt-${groupId}-${i}-${group.drawnAt}`,
      appUrl,
      groupUrl,
      giverName: p.name,
      receiverName: receiver?.name ?? "?",
      groupName: group.name,
      when,
      place: group.place,
      budget,
      ics,
    });
    if (outcome.ok) {
      await save({ status: "sent", attempts: prev.attempts + 1, resendId: outcome.id, error: undefined });
    } else if (outcome.reason === "tomorrow") {
      await save({ status: "tomorrow", attempts: prev.attempts + 1, error: outcome.error });
    } else {
      await save({ status: "failed", attempts: prev.attempts + 1, error: outcome.error });
    }
  }

  return emailSummary(group, participants);
}
