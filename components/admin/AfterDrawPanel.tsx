"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { useAdminAuth } from "@/components/cavos/useAdminAuth";
import { Button } from "@/components/ui/Button";
import { Marker } from "@/components/ui/Marker";
import { Pill } from "@/components/ui/Pill";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import type { Group } from "@/lib/contract/types";
import { copy } from "@/lib/copy/es-CR";

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
      toast.show(copy.common.error, "pink");
    } finally {
      setRetrying(false);
    }
  };

  const copyLink = async (l: GhostLink) => {
    await navigator.clipboard.writeText(l.url);
    toast.show(copy.invite.copied, "blue");
  };

  const showQr = async (l: GhostLink) => {
    const dataUrl = await QRCode.toDataURL(l.url, { margin: 1, width: 280, color: { dark: "#111111", light: "#ffffff" } });
    setQr({ name: l.name, dataUrl });
  };

  if (error) {
    return (
      <section className="rounded-md border border-line p-4">
        <p className="text-sm">
          <Marker tone="pink">{error}</Marker>
        </p>
        <Button variant="ghost" className="mt-2 h-9 px-3" onClick={() => void load()}>
          {copy.pwa.retry}
        </Button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-label="correos">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">
            {emails ? copy.admin.emails(emails.sent, emails.total) : <Spinner className="size-4" />}
          </h3>
          {emails && emails.sent < emails.total && (
            <Button variant="secondary" className="h-9 px-3" loading={retrying} onClick={() => void retry()}>
              {copy.admin.emailsRetry}
            </Button>
          )}
        </div>
        {emails && emails.tomorrow > 0 && (
          <p className="text-sm">
            <Marker tone="pink">{copy.admin.emailsTomorrow}</Marker>
          </p>
        )}
        {emails && (
          <ul className="flex flex-wrap gap-2">
            {emails.records
              .filter((r) => r.status !== "ghost")
              .map((r) => (
                <li key={r.index}>
                  <Pill tone={r.status === "sent" ? "blue" : r.status === "pending" ? "neutral" : "pink"} dot>
                    {r.name}
                  </Pill>
                </li>
              ))}
          </ul>
        )}
      </section>

      {links && links.length > 0 && (
        <section className="space-y-3" aria-label={copy.admin.ghostLinks}>
          <div>
            <h3 className="text-lg font-semibold">{copy.admin.ghostLinks}</h3>
            <p className="text-sm text-ink-soft">{copy.admin.ghostLinksHint}</p>
          </div>
          <ul className="space-y-2">
            {links.map((l) => (
              <li key={l.index} className="flex flex-col gap-2 rounded-md border border-line p-3">
                <span className="flex items-center gap-2">
                  {l.name}
                  {l.used && <Pill tone="blue">ya lo abrió</Pill>}
                </span>
                <span className="flex gap-2">
                  <Button className="h-9 px-3" onClick={() => void copyLink(l)}>
                    {copy.admin.copyGhostLink(l.name)}
                  </Button>
                  <Button variant="secondary" className="h-9 px-3" onClick={() => void showQr(l)}>
                    {copy.admin.showQr}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Sheet open={qr !== null} onClose={() => setQr(null)} title={qr ? `el papelito de ${qr.name}` : undefined}>
        {qr && (
          <div className="flex flex-col items-center gap-3 pb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.dataUrl} alt={`qr para ${qr.name}`} width={280} height={280} className="rounded-md border border-line" />
            <p className="text-center text-sm text-ink-soft">{copy.admin.ghostLinksHint}</p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
