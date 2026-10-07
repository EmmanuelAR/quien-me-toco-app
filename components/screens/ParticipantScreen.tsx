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
import { Button, buttonClass } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { WishlistCard } from "@/components/ui/WishlistCard";
import { AlertIcon, ChevronRightIcon } from "@/components/ui/icons";
import { GroupProgress, GroupSummary } from "./GroupSummary";
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
      toast.show(copy.wishlist.saved, "ok");
    } catch {
      toast.show(copy.common.error, "error");
    }
  };

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

  if (group.archived && !isAdmin) {
    return (
      <Page>
        <AppHeader backHref="/" title={group.name} right={<Pill>{copy.status.archived}</Pill>} />
        <p className="text-lg text-pretty text-ink-soft">{copy.admin.archived}</p>
      </Page>
    );
  }

  const missing = Math.max(group.expectedCount - group.participantCount, 0);
  const receiver = receiverIndex !== null ? participants[receiverIndex] : null;

  return (
    <Page>
      <AppHeader backHref="/" title={group.name}>
        <GroupProgress status={group.status} />
      </AppHeader>

      {!isAuthenticated ? (
        <div className="space-y-8 pb-12">
          <GroupSummary group={group} />
          <Button size="lg" fullWidth loading={isLoading} onClick={() => setLoginOpen(true)}>
            {copy.auth.enter}
          </Button>
        </div>
      ) : !me ? (
        <div className="space-y-8 pb-12">
          <p className="text-xl font-semibold">{copy.participant.notInGroup}</p>
          <GroupSummary group={group} />
          {isAdmin && (
            <Link href={`/g/${groupId.toString()}/admin`} className={buttonClass({ size: "lg", fullWidth: true })}>
              {copy.admin.title}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-12 pb-12">
          {group.status < GroupStatus.Drawn && (
            <section className="space-y-1">
              <p className="text-lg text-pretty">
                {group.status === GroupStatus.DrawRequested ? copy.participant.drawing : copy.participant.waiting}
              </p>
              {missing > 0 && group.status === GroupStatus.Open && <p className="text-ink-soft">{copy.participant.missing(missing)}</p>}
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
                <section className="space-y-5 rounded-md bg-surface p-6">
                  <p className="text-lg text-pretty">{copy.participant.noKeyYet}</p>
                  <Button size="lg" fullWidth onClick={() => void moveHere()} loading={busy}>
                    {copy.participant.moveKey}
                  </Button>
                </section>
              ) : slip.kind === "moving" ? (
                <section className="flex items-start gap-3 rounded-md bg-surface p-6">
                  <Spinner className="mt-0.5 text-ink-soft" />
                  <div>
                    <p>{copy.participant.movingKey}</p>
                    <p className="mt-1 text-sm text-ink-soft">{copy.participant.movingKeyHint}</p>
                  </div>
                </section>
              ) : slip.kind === "error" ? (
                <section className="space-y-5 rounded-md bg-surface p-6">
                  <p className="flex items-start gap-2">
                    <AlertIcon className="mt-0.5" />
                    {copy.common.error}
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

          <section className="space-y-4">
            <GroupSummary group={group} />
            <AddToCalendar group={group} />
          </section>

          <div className="flex flex-col items-center gap-2">
            {isAdmin && (
              <Link href={`/g/${groupId.toString()}/admin`} className="link flex items-center gap-1 py-2">
                {copy.admin.title}
                <ChevronRightIcon className="size-4" />
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={() => void refresh()}>
              {copy.common.refresh}
            </Button>
          </div>
        </div>
      )}

      <LoginSheet open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Page>
  );
}
