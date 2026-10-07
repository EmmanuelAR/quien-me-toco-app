"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCavos } from "@cavos/kit/react";
import { LoginSheet } from "@/components/cavos/LoginSheet";
import { useWrite } from "@/components/cavos/useWrite";
import { useGroup } from "@/components/data/useGroup";
import { RevealCard } from "@/components/draw/RevealCard";
import { useSlip } from "@/components/draw/useSlip";
import { AddToCalendar } from "@/components/share/AddToCalendar";
import { AppHeader, Page } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Marker } from "@/components/ui/Marker";
import { Pill } from "@/components/ui/Pill";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { WishlistCard } from "@/components/ui/WishlistCard";
import { GroupSummary, StatusPill } from "./GroupSummary";
import { calls } from "@/lib/contract/calls";
import { readWishlist } from "@/lib/contract/reads";
import { GroupStatus, emptyWishlist, type Wishlist } from "@/lib/contract/types";
import { copy } from "@/lib/copy/es-CR";

export function ParticipantScreen({ groupId }: { groupId: bigint }) {
  const router = useRouter();
  const toast = useToast();
  const { isAuthenticated, isLoading, address } = useCavos();
  const { data, loading, notFound, error, refresh } = useGroup(groupId, { pollMs: 8_000 });
  const { write, busy } = useWrite();
  const [loginOpen, setLoginOpen] = useState(false);
  const [myWishlist, setMyWishlist] = useState<Wishlist | null>(null);
  const [theirWishlist, setTheirWishlist] = useState<Wishlist | null>(null);

  const group = data?.group ?? null;
  const participants = useMemo(() => data?.participants ?? [], [data]);
  const me = useMemo(
    () => (address ? participants.find((p) => !p.isGhost && BigInt(p.account) === BigInt(address)) ?? null : null),
    [participants, address],
  );
  const isAdmin = Boolean(group && address && BigInt(group.admin) === BigInt(address));
  const { state: slip, moveHere, retry } = useSlip(group, me, address);

  // revelado: todos a la cadena
  useEffect(() => {
    if (group?.status === GroupStatus.Revealed) router.replace(`/g/${groupId.toString()}/revelacion`);
  }, [group?.status, groupId, router]);

  useEffect(() => {
    if (!me) return;
    void readWishlist(groupId, me.index).then(setMyWishlist);
  }, [groupId, me]);

  const receiverIndex = slip.kind === "ready" ? slip.receiver : null;
  useEffect(() => {
    if (receiverIndex === null) return;
    const load = () => void readWishlist(groupId, receiverIndex).then(setTheirWishlist);
    load();
    const t = window.setInterval(load, 15_000);
    return () => window.clearInterval(t);
  }, [groupId, receiverIndex]);

  const saveMine = async (next: Wishlist) => {
    if (!me) return;
    try {
      await write(calls.updateWishlist(groupId, me.index, next));
      setMyWishlist(next);
      toast.show(copy.wishlist.saved, "blue");
    } catch {
      toast.show(copy.common.error, "pink");
    }
  };

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

  const missing = Math.max(group.expectedCount - group.participantCount, 0);
  const receiver = receiverIndex !== null ? participants[receiverIndex] : null;

  return (
    <Page>
      <AppHeader backHref="/" title={group.name} right={<StatusPill status={group.status} />} />

      {!isAuthenticated ? (
        <div className="mt-6 space-y-4">
          <GroupSummary group={group} compact />
          <Button size="lg" fullWidth loading={isLoading} onClick={() => setLoginOpen(true)}>
            {copy.auth.enter}
          </Button>
        </div>
      ) : !me ? (
        <div className="mt-6 space-y-4">
          <GroupSummary group={group} compact />
          <p className="text-lg">
            <Marker tone="pink">{copy.participant.notInGroup}</Marker>
          </p>
          {isAdmin && (
            <Link href={`/g/${groupId.toString()}/admin`} className="flex h-12 items-center justify-center rounded-pill bg-ink px-5 font-medium text-white">
              {copy.admin.title}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6 pb-8">
          {group.status < GroupStatus.Drawn && (
            <section className="space-y-3">
              <p className="text-ink-soft">
                {group.status === GroupStatus.DrawRequested ? copy.participant.drawing : copy.participant.waiting}
              </p>
              {missing > 0 && group.status === GroupStatus.Open && <Pill tone="blue">{copy.participant.missing(missing)}</Pill>}
            </section>
          )}

          {group.status >= GroupStatus.Drawn && (
            <>
              {slip.kind === "loading" ? (
                <div className="flex items-center gap-2 text-ink-soft">
                  <Spinner className="size-4" /> {copy.common.loading}
                </div>
              ) : slip.kind === "ready" && receiver ? (
                <RevealCard receiverName={receiver.name} sealedOk={slip.sealedOk} storageKey={`qmt:revealed:${groupId}:${me.index}`} />
              ) : slip.kind === "no-key" ? (
                <section className="rounded-md border border-line bg-white p-5 shadow-card">
                  <p className="mb-3">
                    <Marker tone="pink">{copy.participant.noKeyYet}</Marker>
                  </p>
                  <Button fullWidth onClick={() => void moveHere()} loading={busy}>
                    {copy.participant.moveKey}
                  </Button>
                </section>
              ) : slip.kind === "moving" ? (
                <section className="rounded-md border border-line bg-white p-5 shadow-card">
                  <div className="flex items-center gap-3">
                    <Spinner />
                    <div>
                      <p>{copy.participant.movingKey}</p>
                      <p className="text-sm text-ink-soft">{copy.participant.movingKeyHint}</p>
                    </div>
                  </div>
                </section>
              ) : slip.kind === "error" ? (
                <section className="rounded-md border border-line bg-white p-5 shadow-card">
                  <p className="mb-3">
                    <Marker tone="pink">{copy.common.error}</Marker>
                  </p>
                  <Button variant="secondary" onClick={() => void retry()}>
                    {copy.pwa.retry}
                  </Button>
                </section>
              ) : null}

              {receiver && theirWishlist && (
                <WishlistCard title={copy.wishlist.theirs(receiver.name)} wishlist={theirWishlist} live />
              )}
            </>
          )}

          <WishlistCard title={copy.wishlist.mine} wishlist={myWishlist ?? emptyWishlist} editable saving={busy} onSave={saveMine} />

          <GroupSummary group={group} compact />
          <AddToCalendar group={group} />

          {isAdmin && (
            <Link href={`/g/${groupId.toString()}/admin`} className="block text-center text-sm underline decoration-marker-blue decoration-2 underline-offset-4">
              {copy.admin.title}
            </Link>
          )}
          <button type="button" onClick={() => void refresh()} className="text-center text-xs text-ink-soft">
            {copy.pwa.retry}
          </button>
        </div>
      )}

      <LoginSheet open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Page>
  );
}
