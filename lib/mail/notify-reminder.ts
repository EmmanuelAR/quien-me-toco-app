import "server-only";
import { createElement } from "react";
import { render } from "@react-email/components";
import { Reminder } from "@/emails/Reminder";
import { appUrl } from "@/lib/brand/links";
import {
  getAssignmentForGiver,
  listGroupsNeedingReminder,
  listMembers,
  markReminderSent,
} from "@/lib/db/groups";
import { formatBudget, formatDateTimeLong } from "@/lib/format";
import { mailConfigured, mailFrom, resend } from "./client";

export type ReminderRunResult = {
  configured: boolean;
  groups: number;
  sent: number;
  failed: number;
};

function isSendableEmail(email: string | null | undefined): email is string {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (!e.includes("@")) return false;
  if (e.endsWith(".invalid") || e.endsWith(".test") || e.endsWith(".local")) return false;
  return true;
}

/** recordatorios a quienes ya tienen asignación y correo real */
export async function sendUpcomingReminders(): Promise<ReminderRunResult> {
  if (!mailConfigured()) {
    return { configured: false, groups: 0, sent: 0, failed: 0 };
  }
  const client = resend();
  if (!client) return { configured: false, groups: 0, sent: 0, failed: 0 };

  const groups = await listGroupsNeedingReminder();
  let sent = 0;
  let failed = 0;

  for (const group of groups) {
    const members = await listMembers(group.id);
    const eventAt = Math.floor(new Date(group.event_at).getTime() / 1000);
    const when = formatDateTimeLong(eventAt, "America/Costa_Rica");
    const budget = formatBudget(group.budget_min, group.budget_max, group.currency);
    const groupUrl = appUrl(`/g/${group.id}`);
    const base = appUrl("/");

    for (const m of members) {
      if (!isSendableEmail(m.email)) continue;
      const assignment = await getAssignmentForGiver(group.id, m.id);
      if (!assignment) continue;

      try {
        const html = await render(
          createElement(Reminder, {
            appUrl: base,
            groupUrl,
            name: m.name,
            groupName: group.name,
            when,
            place: group.place,
            budget,
          }),
        );
        const text = await render(
          createElement(Reminder, {
            appUrl: base,
            groupUrl,
            name: m.name,
            groupName: group.name,
            when,
            place: group.place,
            budget,
          }),
          { plainText: true },
        );
        const { error } = await client.emails.send({
          from: mailFrom(),
          to: m.email,
          subject: `${m.name}, se acerca el intercambio de ${group.name}`,
          html,
          text,
        });
        if (error) {
          console.error("reminder resend error", m.email, error);
          failed += 1;
        } else {
          sent += 1;
        }
      } catch (e) {
        console.error("reminder throw", m.email, e);
        failed += 1;
      }
    }

    await markReminderSent(group.id);
  }

  return { configured: true, groups: groups.length, sent, failed };
}
