"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { useAdminAuth } from "@/components/cavos/useAdminAuth";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { AlertIcon, CheckIcon } from "@/components/ui/icons";
import { colors } from "@/lib/brand/tokens";
import type { Group } from "@/lib/contract/types";
import { copy } from "@/lib/copy/es-CR";
import { cn } from "@/lib/cn";

interface EmailSummary {
  total: number;
  sent: number;
  tomorrow: number;
  failed: number;
  pending: number;
  records: Array<{ index: number; name: string; status: string; error?: string }>;
}

interface GhostLink {
  index: number;
  name: string;
  url: string;
  used: boolean;
}

function emailStatusLabel(status: string): string {
  if (status === "sent") return copy.admin.emailStatus.sent;
  if (status === "pending") return copy.admin.emailStatus.pending;
  if (status === "tomorrow") return copy.admin.emailStatus.tomorrow;
  return copy.admin.emailStatus.failed;
}

/** después del sorteo: estado de correos y links privados (ambos solo para la admin) */
export function AfterDrawPanel({ group }: { group: Group }) {
  const toast = useToast();
  const { adminFetch } = useAdminAuth();
  const [emails, setEmails] = useState<EmailSummary | null>(null);
  const [links, setLinks] = useState<GhostLink[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [qr, setQr] = useState<{ name: string; dataUrl: string } | null>(null);

  const load = useCallback(
    () =>
      Promise.all([
        adminFetch<EmailSummary>("email-status", group.id, `/api/groups/${group.id}/emails`),
        adminFetch<{ links: GhostLink[] }>("ghost-links", group.id, `/api/groups/${group.id}/ghost-links`),
      ])
        .then(([e, l]) => {
          setEmails(e);
          setLinks(l.links);
          setError(null);
        })
        .catch((err: unknown) => setError(err instanceof Error ? err.message : copy.common.error)),
    [adminFetch, group.id],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const retry = async () => {
    setRetrying(true);
    try {
      setEmails(await adminFetch<EmailSummary>("emails", group.id, `/api/groups/${group.id}/emails`, { method: "POST" }));
    } catch {
      toast.show(copy.common.error, "error");
    } finally {
      setRetrying(false);
    }
  };

  const copyLink = async (l: GhostLink) => {
    await navigator.clipboard.writeText(l.url);
    toast.show(copy.invite.copied, "ok");
  };

  const showQr = async (l: GhostLink) => {
    const dataUrl = await QRCode.toDataURL(l.url, { margin: 1, width: 280, color: { dark: colors.ink, light: colors.bg } });
    setQr({ name: l.name, dataUrl });
  };

  if (error) {
    return (
      <section className="space-y-3">
        <p className="flex items-start gap-1.5">
          <AlertIcon className="mt-1 size-4" />
          {error}
        </p>
        <Button variant="secondary" size="sm" onClick={() => void load()}>
          {copy.pwa.retry}
        </Button>
      </section>
    );
  }

  return (
    <div className="space-y-12">
      <section className="space-y-4" aria-label={copy.admin.emailsLabel}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tabular">
            {emails ? copy.admin.emails(emails.sent, emails.total) : <Spinner className="size-4 text-ink-soft" />}
          </h2>
          {emails && emails.sent < emails.total && (
            <Button variant="secondary" size="sm" loading={retrying} onClick={() => void retry()}>
              {copy.admin.emailsRetry}
            </Button>
          )}
        </div>
        {emails && emails.tomorrow > 0 && <p className="text-sm text-pretty text-ink-soft">{copy.admin.emailsTomorrow}</p>}
        {emails && (
          <ul className="divide-y divide-line border-y border-line">
            {emails.records
              .filter((r) => r.status !== "ghost")
              .map((r) => {
                const failed = r.status !== "sent" && r.status !== "pending" && r.status !== "tomorrow";
                return (
                  <li key={r.index} className="flex min-h-12 items-center justify-between gap-3">
                    <span className="min-w-0 truncate">{r.name}</span>
                    <span className={cn("flex shrink-0 items-center gap-1.5 text-sm", r.status === "sent" || failed ? "text-ink" : "text-ink-soft")}>
                      {r.status === "sent" && <CheckIcon className="size-4" />}
                      {failed && <AlertIcon className="size-4" />}
                      {emailStatusLabel(r.status)}
                    </span>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      {links && links.length > 0 && (
        <section className="space-y-4" aria-label={copy.admin.ghostLinks}>
          <div>
            <h2 className="text-lg font-semibold">{copy.admin.ghostLinks}</h2>
            <p className="mt-1 text-sm text-pretty text-ink-soft">{copy.admin.ghostLinksHint}</p>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {links.map((l) => (
              <li key={l.index} className="space-y-3 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">{l.name}</span>
                  {l.used && <Pill>{copy.admin.ghostOpened}</Pill>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => void copyLink(l)}>
                    {copy.admin.copyGhostLink(l.name)}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => void showQr(l)}>
                    {copy.admin.showQr}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Sheet open={qr !== null} onClose={() => setQr(null)} title={qr ? copy.admin.qrTitle(qr.name) : undefined}>
        {qr && (
          <div className="flex flex-col items-center gap-4 pb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.dataUrl} alt={copy.admin.qrAlt(qr.name)} width={280} height={280} className="rounded-sm" />
            <p className="text-center text-sm text-pretty text-ink-soft">{copy.admin.ghostLinksHint}</p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
