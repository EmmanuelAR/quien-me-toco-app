"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/auth/session";
import { useGroup } from "@/components/data/useGroup";
import { ChainReveal } from "@/components/draw/ChainReveal";
import { AppHeader, Page } from "@/components/ui/AppHeader";
import { buttonClass } from "@/components/ui/Button";
import { Confetti } from "@/components/ui/Confetti";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/lib/api/client";
import { copy } from "@/lib/copy/es-CR";

export function FinalRevealScreen({ groupId }: { groupId: string }) {
  const { data: session } = useSession();
  const { data: group, loading, notFound, error } = useGroup(groupId, { pollMs: 10_000 });
  const [pairs, setPairs] = useState<Array<{ giver: { id: string; name: string }; receiver: { id: string; name: string } }> | null>(null);
  const [finished, setFinished] = useState(false);

  const isOwner = Boolean(group?.isOwner || (session?.user && group?.isOwner));

  useEffect(() => {
    if (group?.status !== "revealed" || pairs) return;
    void api<{ pairs: typeof pairs }>(`/api/groups/${groupId}/reveal`)
      .then((r) => setPairs(r.pairs))
      .catch(() => setPairs([]));
  }, [group?.status, groupId, pairs]);

  const { names, receivers } = useMemo(() => {
    if (!pairs || pairs.length === 0) return { names: [] as string[], receivers: [] as number[] };
    const names = pairs.map((p) => p.giver.name);
    const indexById = new Map(pairs.map((p, i) => [p.giver.id, i]));
    // ensure receiver order matches giver list; rebuild from members if needed
    const byGiver = new Map(pairs.map((p) => [p.giver.id, p.receiver.id]));
    const ids = pairs.map((p) => p.giver.id);
    // include any receiver-only ids
    for (const p of pairs) {
      if (!indexById.has(p.receiver.id)) {
        indexById.set(p.receiver.id, names.length);
        names.push(p.receiver.name);
        ids.push(p.receiver.id);
      }
    }
    const receivers = ids.map((id) => indexById.get(byGiver.get(id)!) ?? 0);
    return { names, receivers };
  }, [pairs]);

  if (loading && !group) {
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

      {group.status !== "revealed" ? (
        <p className="text-lg text-pretty text-ink-soft">{copy.finalReveal.notYet}</p>
      ) : !pairs ? (
        <Spinner className="text-ink-soft" />
      ) : (
        <div className="space-y-12 pb-12">
          <ChainReveal names={names} receivers={receivers} onDone={() => setFinished(true)} />

          {finished && (
            <div className="animate-rise space-y-12">
              <div className="space-y-3">
                <p className="pb-5 text-center text-xl font-semibold text-balance">{copy.finalReveal.done}</p>
                <Link href="/nuevo" className={buttonClass({ size: "lg", fullWidth: true })}>
                  {copy.finalReveal.createYourOwn}
                </Link>
                {isOwner && (
                  <Link href={`/nuevo?desde=${groupId}`} className={buttonClass({ variant: "secondary", size: "lg", fullWidth: true })}>
                    {copy.finalReveal.repeatNextYear}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
