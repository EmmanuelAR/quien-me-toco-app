"use client";

import { useEffect, useState } from "react";
import { useGroup } from "@/components/data/useGroup";
import { AppHeader, Page } from "@/components/ui/AppHeader";
import { Pill } from "@/components/ui/Pill";
import { Spinner } from "@/components/ui/Spinner";
import { AlertIcon, CheckCircleIcon } from "@/components/ui/icons";
import { findGroupEvent, type FoundEvent } from "@/lib/contract/events";
import { readCommitments, readReveal } from "@/lib/contract/reads";
import { GroupStatus } from "@/lib/contract/types";
import { verifyCommitment } from "@/lib/crypto/commitments";
import { explorerContractUrl, explorerTxUrl } from "@/lib/brand/links";
import { publicEnv } from "@/lib/env";
import { copy } from "@/lib/copy/es-CR";
import { formatDateTimeLong } from "@/lib/format";

type Check = { kind: "checking" } | { kind: "pending"; seals: number } | { kind: "ok"; seals: number } | { kind: "fail"; seals: number; bad: number[] };

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
        <Spinner className="size-8 text-ink-soft" />
      </Page>
    );
  }
  if (notFound || !group) {
    return (
      <Page>
        <AppHeader backHref="/" />
        <p className="text-xl font-semibold text-balance">{error ? copy.common.error : copy.common.notFound}</p>
      </Page>
    );
  }

  return (
    <Page>
      <AppHeader backHref={`/g/${groupId}/revelacion`} eyebrow={group.name} title={copy.verify.title} />
      <div className="space-y-12 pb-12">
        <p className="text-pretty text-ink-soft">{copy.verify.intro}</p>

        <section className="rounded-md bg-surface px-6 py-10 text-center">
          {check.kind === "checking" ? (
            <div className="flex items-center justify-center gap-2 text-ink-soft">
              <Spinner className="size-4" /> {copy.verify.checking}
            </div>
          ) : check.kind === "pending" ? (
            <p className="text-pretty text-ink-soft">{copy.verify.pending}</p>
          ) : check.kind === "ok" ? (
            <div className="animate-reveal flex flex-col items-center gap-3">
              <CheckCircleIcon className="size-12" strokeWidth={1.5} />
              <p className="text-xl font-semibold text-balance">{copy.verify.ok}</p>
              <Pill className="bg-white">{copy.verify.seals(check.seals)}</Pill>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <AlertIcon className="size-12" strokeWidth={1.5} />
              <p className="text-xl font-semibold text-balance">{copy.verify.fail}</p>
            </div>
          )}
        </section>

        {(group.drawnAt > 0 || group.revealedAt > 0) && (
          <dl className="divide-y divide-line border-y border-line">
            {group.drawnAt > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3.5">
                <dt className="text-ink-soft">{copy.verify.sealedAt(formatDateTimeLong(group.drawnAt))}</dt>
                <dd>
                  {drawTx ? (
                    <a className="link" href={explorerTxUrl(drawTx.transactionHash)} target="_blank" rel="noreferrer noopener">
                      {copy.verify.explorerDraw}
                    </a>
                  ) : (
                    <span className="text-ink-soft">…</span>
                  )}
                </dd>
              </div>
            )}
            {group.revealedAt > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3.5">
                <dt className="text-ink-soft">{copy.verify.revealedAt(formatDateTimeLong(group.revealedAt))}</dt>
                <dd>
                  {revealTx ? (
                    <a className="link" href={explorerTxUrl(revealTx.transactionHash)} target="_blank" rel="noreferrer noopener">
                      {copy.verify.explorerReveal}
                    </a>
                  ) : (
                    <span className="text-ink-soft">…</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{copy.verify.howTitle}</h2>
          <ol className="list-decimal space-y-2 pl-5 text-pretty text-ink-soft marker:text-ink">
            {copy.verify.how.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          {publicEnv.contractAddress && (
            <a className="link inline-block text-sm" href={explorerContractUrl(publicEnv.contractAddress)} target="_blank" rel="noreferrer noopener">
              {copy.verify.explorerContract}
            </a>
          )}
        </section>
      </div>
    </Page>
  );
}
