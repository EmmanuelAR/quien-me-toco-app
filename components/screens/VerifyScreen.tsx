"use client";

import { useEffect, useState } from "react";
import { useGroup } from "@/components/data/useGroup";
import { AppHeader, Page } from "@/components/ui/AppHeader";
import { Marker } from "@/components/ui/Marker";
import { Pill } from "@/components/ui/Pill";
import { Spinner } from "@/components/ui/Spinner";
import { findGroupEvent, type FoundEvent } from "@/lib/contract/events";
import { readCommitments, readReveal } from "@/lib/contract/reads";
import { GroupStatus } from "@/lib/contract/types";
import { verifyCommitment } from "@/lib/crypto/commitments";
import { explorerContractUrl, explorerTxUrl } from "@/lib/brand/links";
import { publicEnv } from "@/lib/env";
import { copy } from "@/lib/copy/es-CR";
import { formatDateTimeLong } from "@/lib/format";

type Check = { kind: "checking" } | { kind: "pending"; seals: number } | { kind: "ok"; seals: number } | { kind: "fail"; seals: number; bad: number[] };

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M7 12.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * "verificá que el sorteo fue justo": recalcula cada sello con lo que publicó la
 * revelación y lo compara con lo que quedó sellado el día del sorteo. sin jerga.
 */
export function VerifyScreen({ groupId }: { groupId: bigint }) {
  const { data, loading, notFound, error } = useGroup(groupId, { pollMs: 30_000 });
  const [check, setCheck] = useState<Check>({ kind: "checking" });
  const [drawTx, setDrawTx] = useState<FoundEvent | null>(null);
  const [revealTx, setRevealTx] = useState<FoundEvent | null>(null);

  const group = data?.group ?? null;

  useEffect(() => {
    if (!group) return;
    void (async () => {
      const commitments = await readCommitments(groupId);
      if (group.status < GroupStatus.Drawn) return setCheck({ kind: "pending", seals: 0 });
      const reveal = group.status === GroupStatus.Revealed ? await readReveal(groupId) : null;
      if (!reveal) return setCheck({ kind: "pending", seals: commitments.length });
      const bad: number[] = [];
      reveal.receivers.forEach((r, i) => {
        if (!verifyCommitment(groupId, i, r, reveal.salts[i], commitments[i] ?? 0n)) bad.push(i);
      });
      setCheck(bad.length === 0 ? { kind: "ok", seals: commitments.length } : { kind: "fail", seals: commitments.length, bad });
    })();
    void findGroupEvent("DrawPublished", groupId).then(setDrawTx);
    if (group.status === GroupStatus.Revealed) void findGroupEvent("Revealed", groupId).then(setRevealTx);
  }, [group, groupId]);

  if (loading && !data) {
    return (
      <Page className="items-center justify-center">
        <Spinner className="size-8" />
      </Page>
    );
  }
  if (notFound || !group) {
    return (
      <Page>
        <AppHeader backHref="/" />
        <p className="mt-10 text-lg">
          <Marker tone="pink">{error ? copy.common.error : copy.common.notFound}</Marker>
        </p>
      </Page>
    );
  }

  return (
    <Page>
      <AppHeader backHref={`/g/${groupId}/revelacion`} title={group.name} />
      <section className="space-y-4 pb-10">
        <h2 className="text-2xl font-semibold leading-tight">
          <Marker>{copy.verify.title}</Marker>
        </h2>
        <p className="text-pretty text-ink-soft">{copy.verify.intro}</p>

        <div className="rounded-md border border-line bg-white p-5 text-center shadow-card">
          {check.kind === "checking" ? (
            <div className="flex items-center justify-center gap-2 text-ink-soft">
              <Spinner className="size-4" /> {copy.verify.checking}
            </div>
          ) : check.kind === "pending" ? (
            <p className="text-ink-soft">{copy.verify.pending}</p>
          ) : check.kind === "ok" ? (
            <div className="animate-pop flex flex-col items-center gap-2">
              <CheckIcon />
              <p className="text-lg font-semibold">
                <Marker>{copy.verify.ok}</Marker>
              </p>
              <Pill tone="blue">{copy.verify.seals(check.seals)}</Pill>
            </div>
          ) : (
            <p className="text-lg">
              <Marker tone="pink">{copy.verify.fail}</Marker>
            </p>
          )}
        </div>

        <dl className="space-y-2 text-sm">
          {group.drawnAt > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-ink-soft">{copy.verify.sealedAt(formatDateTimeLong(group.drawnAt))}</dt>
              <dd>
                {drawTx ? (
                  <a className="keep-case underline decoration-marker-blue decoration-2 underline-offset-4" href={explorerTxUrl(drawTx.transactionHash)} target="_blank" rel="noreferrer noopener">
                    {copy.verify.explorerDraw}
                  </a>
                ) : (
                  <span className="text-ink-soft">…</span>
                )}
              </dd>
            </div>
          )}
          {group.revealedAt > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-ink-soft">{copy.verify.revealedAt(formatDateTimeLong(group.revealedAt))}</dt>
              <dd>
                {revealTx ? (
                  <a className="keep-case underline decoration-marker-pink decoration-2 underline-offset-4" href={explorerTxUrl(revealTx.transactionHash)} target="_blank" rel="noreferrer noopener">
                    {copy.verify.explorerReveal}
                  </a>
                ) : (
                  <span className="text-ink-soft">…</span>
                )}
              </dd>
            </div>
          )}
        </dl>

        <section className="space-y-2">
          <h3 className="font-semibold">{copy.verify.howTitle}</h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-soft">
            {copy.verify.how.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          {publicEnv.contractAddress && (
            <a className="keep-case block text-xs text-ink-soft underline underline-offset-4" href={explorerContractUrl(publicEnv.contractAddress)} target="_blank" rel="noreferrer noopener">
              {copy.verify.explorerDraw.replace("el sorteo", "el contrato")}
            </a>
          )}
        </section>
      </section>
    </Page>
  );
}
