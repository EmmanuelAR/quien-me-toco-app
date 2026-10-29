import "server-only";
import { createElement } from "react";
import { render } from "@react-email/components";
import { TeToco } from "@/emails/TeToco";
import { appUrl } from "@/lib/brand/links";
import { buildIcs } from "@/lib/calendar";
import { getGroup, listAssignments, listMembers } from "@/lib/db/groups";
import { formatBudget, formatDateTimeLong } from "@/lib/format";
import { mailConfigured, mailFrom, resend } from "./client";

export type DrawMailResult = {
  configured: boolean;
  sent: number;
  skipped: number;
  failed: number;
};

function isSendableEmail(email: string | null | undefined): email is string {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (!e.includes("@")) return false;
  if (e.endsWith(".invalid") || e.endsWith(".test") || e.endsWith(".local")) return false;
  return true;
}

/** manda el correo “te tocó” a quien tenga email real. no tira si falla uno. */
export async function notifyDrawEmails(groupId: string): Promise<DrawMailResult> {
  if (!mailConfigured()) {
    return { configured: false, sent: 0, skipped: 0, failed: 0 };
  }

  const client = resend();
  const group = await getGroup(groupId);
  if (!group || !client) {
    return { configured: false, sent: 0, skipped: 0, failed: 0 };
  }

  const [members, assignments] = await Promise.all([
    listMembers(groupId),
    listAssignments(groupId),
  ]);
  const byId = new Map(members.map((m) => [m.id, m]));
  const eventAt = Math.floor(new Date(group.event_at).getTime() / 1000);
  const when = formatDateTimeLong(eventAt, "America/Costa_Rica");
  const budget = formatBudget(group.budget_min, group.budget_max, group.currency);
  const groupPath = `/g/${group.id}`;
  const groupUrl = appUrl(groupPath);
  const base = appUrl("/");
  const ics = buildIcs({
    groupId: group.id,
    name: group.name,
    eventAt,
    place: group.place,
    budgetMin: group.budget_min,
    budgetMax: group.budget_max,
    currency: group.currency,
    url: groupUrl,
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const a of assignments) {
    const giver = byId.get(a.giver_id);
    const receiver = byId.get(a.receiver_id);
    if (!giver || !receiver) {
      skipped += 1;
      continue;
    }
    if (!isSendableEmail(giver.email)) {
      skipped += 1;
      continue;
    }

    try {
      const html = await render(
        createElement(TeToco, {
          appUrl: base,
          groupUrl,
          giverName: giver.name,
          receiverName: receiver.name,
          groupName: group.name,
          when,
          place: group.place,
          budget,
        }),
      );
      const text = await render(
        createElement(TeToco, {
          appUrl: base,
          groupUrl,
          giverName: giver.name,
          receiverName: receiver.name,
          groupName: group.name,
          when,
          place: group.place,
          budget,
        }),
        { plainText: true },
      );

      const { error } = await client.emails.send({
        from: mailFrom(),
        to: giver.email,
        subject: `${giver.name}, ya sabemos quién te tocó`,
        html,
        text,
        attachments: [
          {
            filename: "intercambio.ics",
            content: Buffer.from(ics, "utf8"),
            contentType: "text/calendar; charset=utf-8; method=PUBLISH",
          },
        ],
      });

      if (error) {
        console.error("resend error", giver.email, error);
        failed += 1;
      } else {
        sent += 1;
      }
    } catch (e) {
      console.error("resend throw", giver.email, e);
      failed += 1;
    }
  }

  return { configured: true, sent, skipped, failed };
}
