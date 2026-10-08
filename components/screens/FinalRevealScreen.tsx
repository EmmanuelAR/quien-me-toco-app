"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCavos } from "@cavos/kit/react";
import { useGroup } from "@/components/data/useGroup";
import { ChainReveal } from "@/components/draw/ChainReveal";
import { PayWithFollow } from "@/components/share/PayWithFollow";
import { AppHeader, Page } from "@/components/ui/AppHeader";
import { buttonClass } from "@/components/ui/Button";
import { Confetti } from "@/components/ui/Confetti";
import { Spinner } from "@/components/ui/Spinner";
import { ChevronRightIcon } from "@/components/ui/icons";
import { readReveal } from "@/lib/contract/reads";
import { GroupStatus, type Reveal } from "@/lib/contract/types";
import { copy } from "@/lib/copy/es-CR";

export function FinalRevealScreen({ groupId }: { groupId: bigint }) {
  const { address } = useCavos();
  const { data, loading, notFound, error } = useGroup(groupId, { pollMs: 10_000 });
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [finished, setFinished] = useState(false);

  const group = data?.group ?? null;
  const participants = data?.participants ?? [];
  const isAdmin = Boolean(group && address && BigInt(group.admin) === BigInt(address));

  useEffect(() => {
    if (group?.status !== GroupStatus.Revealed || reveal) return;
    void readReveal(groupId).then(setReveal);
  }, [group?.status, groupId, reveal]);

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
      <Confetti active={finished} />
      <AppHeader backHref={`/g/${groupId}`} eyebrow={group.name} title={copy.finalReveal.title} subtitle={copy.finalReveal.sub} />

      {group.status !== GroupStatus.Revealed ? (
        <p className="text-lg text-pretty text-ink-soft">{copy.finalReveal.notYet}</p>
      ) : !reveal ? (
        <Spinner className="text-ink-soft" />
      ) : (
        <div className="space-y-12 pb-12">
          <ChainReveal names={participants.map((p) => p.name)} receivers={reveal.receivers} onDone={() => setFinished(true)} />

          {finished && (
            <div className="animate-rise space-y-12">
              <div className="space-y-3">
                <p className="pb-5 text-center text-xl font-semibold text-balance">{copy.finalReveal.done}</p>
                <Link href="/nuevo" className={buttonClass({ size: "lg", fullWidth: true })}>
                  {copy.finalReveal.createYourOwn}
                </Link>
                {isAdmin && (
                  <Link href={`/nuevo?desde=${groupId}`} className={buttonClass({ variant: "secondary", size: "lg", fullWidth: true })}>
                    {copy.finalReveal.repeatNextYear}
                  </Link>
                )}
                <Link href={`/g/${groupId}/verificar`} className="link flex items-center justify-center gap-1 py-3">
                  {copy.finalReveal.verify}
                  <ChevronRightIcon className="size-4" />
                </Link>
              </div>
              <PayWithFollow groupId={groupId} />
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
