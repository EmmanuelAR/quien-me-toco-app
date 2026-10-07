"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCavos } from "@cavos/kit/react";
import { useGroup } from "@/components/data/useGroup";
import { ChainReveal } from "@/components/draw/ChainReveal";
import { PayWithFollow } from "@/components/share/PayWithFollow";
import { AppHeader, Page } from "@/components/ui/AppHeader";
import { Marker } from "@/components/ui/Marker";
import { Spinner } from "@/components/ui/Spinner";
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
      <AppHeader backHref={`/g/${groupId}`} title={group.name} />
      <section className="pb-6 pt-2">
        <h2 className="flex flex-col items-start gap-2 text-2xl font-semibold leading-tight">
          <Marker>{copy.finalReveal.title}</Marker>
          <span>{copy.finalReveal.sub}</span>
        </h2>
      </section>

      {group.status !== GroupStatus.Revealed ? (
        <p className="text-ink-soft">{copy.finalReveal.notYet}</p>
      ) : !reveal ? (
        <Spinner />
      ) : (
        <div className="space-y-8 pb-10">
          <ChainReveal names={participants.map((p) => p.name)} receivers={reveal.receivers} onDone={() => setFinished(true)} />

          {finished && (
            <div className="animate-rise space-y-3">
              <p className="text-center text-lg">{copy.finalReveal.done}</p>
              <Link href="/nuevo" className="flex h-12 items-center justify-center rounded-pill bg-ink px-5 font-medium text-white">
                {copy.finalReveal.createYourOwn}
              </Link>
              {isAdmin && (
                <Link href={`/nuevo?desde=${groupId}`} className="flex h-12 items-center justify-center rounded-pill border border-ink px-5 font-medium">
                  {copy.finalReveal.repeatNextYear}
                </Link>
              )}
              <Link href={`/g/${groupId}/verificar`} className="block text-center underline decoration-marker-blue decoration-2 underline-offset-4">
                {copy.finalReveal.verify}
              </Link>
              <PayWithFollow groupId={groupId} />
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
