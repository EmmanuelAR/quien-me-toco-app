"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/session";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { useGroup } from "@/components/data/useGroup";
import { RevealCard } from "@/components/draw/RevealCard";
import { AddToCalendar } from "@/components/share/AddToCalendar";
import { AppHeader, Page } from "@/components/ui/AppHeader";
import { buttonClass } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { WishlistCard } from "@/components/ui/WishlistCard";
import { WishlistFillList } from "@/components/ui/WishlistFillList";
import { GroupProgress, GroupSummary } from "./GroupSummary";
import { api } from "@/lib/api/client";
import { emptyWishlist, type Wishlist } from "@/lib/app/types";
import { copy } from "@/lib/copy/es-CR";

export function ParticipantScreen({ groupId }: { groupId: string }) {
  const router = useRouter();
  const toast = useToast();
  const { data: session, isPending: authPending } = useSession();
  const isAuthenticated = Boolean(session?.user);
  const { data: group, loading, notFound, error, refresh } = useGroup(groupId, { pollMs: 8_000 });
  const [busy, setBusy] = useState(false);
  const [assignment, setAssignment] = useState<{
    receiver: { id: string; name: string; wishlist: Wishlist };
  } | null>(null);

  useEffect(() => {
    if (group?.status === "revealed") router.replace(`/g/${groupId}/revelacion`);
  }, [group?.status, groupId, router]);

  useEffect(() => {
    if (!group || (group.status !== "drawn" && group.status !== "revealed")) {
      setAssignment(null);
      return;
    }
    if (!group.myMemberId) return;
    void api<{ receiver: { id: string; name: string; wishlist: Wishlist } }>(
      `/api/groups/${groupId}/my-assignment`,
    )
      .then((r) => setAssignment({ receiver: r.receiver }))
      .catch(() => setAssignment(null));
  }, [group, groupId]);

  const me = group?.members.find((m) => m.id === group.myMemberId) ?? null;
  const myWishlist = me?.wishlist ?? emptyWishlist;
  const wishlistRows =
    group?.members.map((m) => ({
      id: m.id,
      name: m.name,
      filled: Boolean(m.wishlist.ideas.trim() || m.wishlist.sizes.trim() || m.wishlist.links.trim()),
    })) ?? [];

  const saveMine = async (next: Wishlist) => {
    if (!me) return;
    setBusy(true);
    try {
      await api(`/api/members/${me.id}/wishlist`, {
        method: "PATCH",
        body: JSON.stringify(next),
      });
      await refresh();
      toast.show(copy.wishlist.saved, "ok");
    } catch {
      toast.show(copy.common.error, "error");
    } finally {
      setBusy(false);
    }
  };

  if (authPending || (loading && !group)) {
    return (
      <Page className="items-center justify-center">
        <Spinner className="size-8 text-ink-soft" />
      </Page>
    );
  }

  if (!isAuthenticated) {
    return (
      <Page>
        <AppHeader backHref="/" />
        <p className="mb-6 text-pretty text-ink-soft">{copy.auth.needLogin}</p>
        <GoogleLoginButton callbackURL={`/g/${groupId}`} />
      </Page>
    );
  }

  if (notFound || !group) {
    return (
      <Page>
        <AppHeader backHref="/dashboard" />
        <p className="text-xl font-semibold">{error ? copy.common.error : copy.common.notFound}</p>
      </Page>
    );
  }

  if (group.archived && !group.isOwner) {
    return (
      <Page>
        <AppHeader backHref="/dashboard" title={group.name} right={<Pill>{copy.status.archived}</Pill>} />
        <p className="text-lg text-pretty text-ink-soft">{copy.admin.archived}</p>
      </Page>
    );
  }

  if (!group.myMemberId) {
    return (
      <Page>
        <AppHeader backHref="/dashboard" title={group.name} />
        <p className="text-pretty text-ink-soft">{copy.participant.notInGroup}</p>
      </Page>
    );
  }

  return (
    <Page>
      <AppHeader
        backHref="/dashboard"
        title={group.name}
        right={
          group.isOwner ? (
            <Link href={`/g/${groupId}/admin`} className="text-sm font-medium text-ink-soft">
              {copy.admin.title}
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-10 pb-16">
        <GroupProgress status={group.status} />
        <GroupSummary group={group} />

        <AddToCalendar
          groupId={group.id}
          name={group.name}
          eventAt={group.eventAt}
          place={group.place}
          budgetMin={group.budgetMin}
          budgetMax={group.budgetMax}
          currency={group.currency}
        />

        <WishlistCard
          title={copy.wishlist.mine}
          wishlist={myWishlist}
          editable={group.status !== "revealed"}
          saving={busy}
          onSave={saveMine}
        />

        <WishlistFillList rows={wishlistRows} />

        {assignment && (
          <section className="space-y-4">
            <RevealCard
              receiverName={assignment.receiver.name}
              sealedOk
              storageKey={`qmt:slip:${groupId}:${group.myMemberId}`}
            />
            <WishlistCard
              title={copy.wishlist.theirs(assignment.receiver.name)}
              wishlist={assignment.receiver.wishlist}
              live
            />
          </section>
        )}

        {group.status === "open" && !assignment && (
          <p className="text-pretty text-ink-soft">{copy.participant.waiting}</p>
        )}
      </div>
    </Page>
  );
}
