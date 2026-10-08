"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCavos } from "@cavos/kit/react";
import { AfterDrawPanel } from "@/components/admin/AfterDrawPanel";
import { ExclusionsEditor } from "@/components/admin/ExclusionsEditor";
import { GhostsPanel } from "@/components/admin/GhostsPanel";
import { LoginSheet } from "@/components/cavos/LoginSheet";
import { useWrite } from "@/components/cavos/useWrite";
import { useGroup, waitForGroup } from "@/components/data/useGroup";
import { useNow } from "@/components/data/useNow";
import { AddToCalendar } from "@/components/share/AddToCalendar";
import { PayWithFollow } from "@/components/share/PayWithFollow";
import { ShareInvite, inviteUrl } from "@/components/share/ShareInvite";
import { AppHeader, Page } from "@/components/ui/AppHeader";
import { Button, buttonClass } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { CheckIcon, ChevronRightIcon, CloseIcon } from "@/components/ui/icons";
import { GroupProgress, GroupSummary } from "./GroupSummary";
import { calls } from "@/lib/contract/calls";
import { readParticipants, readReveal } from "@/lib/contract/reads";
import { GroupStatus, type Exclusion, type Wishlist } from "@/lib/contract/types";
import { copy } from "@/lib/copy/es-CR";
import { formatDateTimeLong } from "@/lib/format";
import { getStoredInviteCode, fetchInviteCodeFromServer } from "@/lib/invite-storage";
import { useAdminAuth } from "@/components/cavos/useAdminAuth";

const REVEAL_GRACE = 86400;

export function AdminScreen({ groupId, justCreated }: { groupId: bigint; justCreated: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const { isAuthenticated, isLoading, address } = useCavos();
  const { data, loading, notFound, error, refresh } = useGroup(groupId, { pollMs: 8_000, withExclusions: true });
  const { write, busy } = useWrite();
  const { authHeader } = useAdminAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [expectedOpen, setExpectedOpen] = useState(false);
  const [expectedDraft, setExpectedDraft] = useState("");
  const [feasible, setFeasible] = useState(true);
  const [previous, setPrevious] = useState<Array<number | null> | undefined>(undefined);
  const [phase, setPhase] = useState<"idle" | "drawing" | "revealing">("idle");
  const [confirmDraw, setConfirmDraw] = useState(false);
  const [inviteCode, setInviteCode] = useState<bigint | null>(null);
  const [inviteCodeLoading, setInviteCodeLoading] = useState(false);

  const group = data?.group ?? null;
  const participants = useMemo(() => data?.participants ?? [], [data]);
  const exclusions = data?.exclusions ?? [];
  const isAdmin = Boolean(group && address && BigInt(group.admin) === BigInt(address));
  const amParticipant = Boolean(address && participants.some((p) => !p.isGhost && BigInt(p.account) === BigInt(address)));

  // "que no te toque la misma persona del año pasado": mapeo para el chequeo de factibilidad
  const previousApplies = Boolean(group?.avoidPrevious && group.previousGroupId !== 0n);
  const previousGroupId = group?.previousGroupId ?? 0n;
  useEffect(() => {
    if (!previousApplies || previousGroupId === 0n) return;
    void Promise.all([readParticipants(previousGroupId), readReveal(previousGroupId)]).then(([prevParticipants, prevReveal]) => {
      if (!prevReveal) return;
      const key = (p: { isGhost: boolean; name: string; account: string }) => (p.isGhost ? `g:${p.name.trim().toLowerCase()}` : `a:${p.account.toLowerCase()}`);
      const prevIdx = new Map(prevParticipants.map((p, i) => [key(p), i]));
      const newIdx = new Map(participants.map((p, i) => [key(p), i]));
      setPrevious(
        participants.map((p) => {
          const pi = prevIdx.get(key(p));
          if (pi === undefined) return null;
          const receiver = prevParticipants[prevReveal.receivers[pi]];
          return receiver ? (newIdx.get(key(receiver)) ?? null) : null;
        }),
      );
    });
  }, [previousApplies, previousGroupId, participants]);
  const previousForCheck = previousApplies ? previous : undefined;
  const now = useNow();

  // Fetch invite code: try localStorage first, then server
  useEffect(() => {
    if (!isAdmin || !group) return;
    const local = getStoredInviteCode(groupId);
    if (local) {
      setInviteCode(local);
      return;
    }
    // Try fetching from server
    setInviteCodeLoading(true);
    authHeader("invite-code", groupId)
      .then((header) => fetchInviteCodeFromServer(groupId, header))
      .then((code) => setInviteCode(code))
      .catch(() => setInviteCode(null))
      .finally(() => setInviteCodeLoading(false));
  }, [isAdmin, group, groupId, authHeader]);

  const run = useCallback(
    async (fn: () => Promise<unknown>, okMessage?: string) => {
      try {
        await fn();
        await refresh();
        if (okMessage) toast.show(okMessage, "ok");
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        toast.show(/not everyone/i.test(m) ? copy.admin.drawDisabled : copy.common.error, "error");
      }
    },
    [refresh, toast],
  );

  const doDraw = async () => {
    if (!group) return;
    setConfirmDraw(false);
    setPhase("drawing");
    try {
      await write(calls.requestDraw(groupId));
      const res = await fetch(`/api/groups/${groupId}/draw`, { method: "POST" });
      if (res.status === 422) {
        toast.show(copy.admin.infeasible, "error");
        await write(calls.cancelDrawRequest(groupId));
        setPhase("idle");
        await refresh();
        return;
      }
      if (!res.ok && res.status !== 409) throw new Error(`draw ${res.status}`);
      await waitForGroup(groupId, (g) => g.status >= GroupStatus.Drawn);
      await refresh();
      toast.show(copy.admin.drawn, "ok");
    } catch {
      toast.show(copy.common.error, "error");
    } finally {
      setPhase("idle");
    }
  };

  const doReveal = async () => {
    setPhase("revealing");
    try {
      await write(calls.requestReveal(groupId));
      const res = await fetch(`/api/groups/${groupId}/reveal`, { method: "POST" });
      if (!res.ok && res.status !== 409) throw new Error(`reveal ${res.status}`);
      await waitForGroup(groupId, (g) => g.status === GroupStatus.Revealed);
      router.push(`/g/${groupId}/revelacion`);
    } catch {
      toast.show(copy.common.error, "error");
      setPhase("idle");
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
  if (!isAuthenticated) {
    return (
      <Page>
        <AppHeader backHref="/" title={group.name} />
        <Button size="lg" fullWidth loading={isLoading} onClick={() => setLoginOpen(true)}>
          {copy.auth.enter}
        </Button>
        <LoginSheet open={loginOpen} onClose={() => setLoginOpen(false)} />
      </Page>
    );
  }
  if (!isAdmin) {
    return (
      <Page>
        <AppHeader backHref="/" title={group.name} />
        <p className="text-lg text-pretty text-ink-soft">{copy.admin.onlyAdmin}</p>
        <Link href={`/g/${groupId}`} className={`${buttonClass({ size: "lg", fullWidth: true })} mt-8`}>
          {copy.participant.reveal}
        </Link>
      </Page>
    );
  }

  const s = group.status;

  if (group.archived) {
    return (
      <Page>
        <AppHeader backHref="/" title={group.name} right={<Pill>{copy.status.archived}</Pill>} />
        <p className="text-lg text-pretty text-ink-soft">{copy.admin.archived}</p>
        <Button className="mt-8" size="lg" fullWidth loading={busy} onClick={() => void run(() => write(calls.setArchived(groupId, false)))}>
          {copy.admin.unarchive}
        </Button>
      </Page>
    );
  }
  const beforeDraw = s === GroupStatus.Open || s === GroupStatus.Closed;
  const missing = Math.max(group.expectedCount - group.participantCount, 0);
  const everyoneIn = group.participantCount === group.expectedCount && group.participantCount >= 3;
  const canRevealNow = now > 0 && now + REVEAL_GRACE >= group.eventAt;
  const accountNames = participants.filter((p) => !p.isGhost);

  return (
    <Page>
      <AppHeader backHref="/" title={group.name}>
        <GroupProgress status={s} />
      </AppHeader>

      <div className="space-y-12 pb-12">
        {justCreated && s === GroupStatus.Open && (
          <p className="flex items-center gap-2 text-lg font-semibold">
            <CheckIcon />
            {copy.create.created}
          </p>
        )}

        {s === GroupStatus.Open && inviteCode && (
          <section className="space-y-3">
            <ShareInvite group={group} inviteCode={inviteCode} />
            <p className="truncate text-center text-xs text-ink-soft">{inviteUrl(groupId, inviteCode)}</p>
          </section>
        )}

        {/* registrados */}
        <section className="space-y-4" aria-label={copy.admin.registered}>
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold">{copy.admin.registered}</h2>
              <span className="text-lg text-ink-soft tabular">{copy.admin.expected(group.participantCount, group.expectedCount)}</span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">{copy.admin.missing(missing)}</p>
          </div>
          {accountNames.length > 0 && (
            <ul className="divide-y divide-line border-y border-line">
              {accountNames.map((p) => (
                <li key={p.index} className="flex min-h-14 items-center justify-between gap-3">
                  <span className="min-w-0 truncate">{p.name}</span>
                  {beforeDraw && (
                    <button
                      type="button"
                      aria-label={copy.admin.removePerson(p.name)}
                      className="-mr-3 flex size-11 shrink-0 items-center justify-center rounded-pill text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-40"
                      onClick={() => void run(() => write(calls.removeParticipant(groupId, p.index)))}
                      disabled={busy}
                    >
                      <CloseIcon className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {beforeDraw && (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setExpectedDraft(String(group.expectedCount)); setExpectedOpen(true); }}>
                {copy.admin.changeExpected}
              </Button>
              {s === GroupStatus.Open ? (
                <Button variant="secondary" size="sm" loading={busy} onClick={() => void run(() => write(calls.closeRegistrations(groupId)))}>
                  {copy.admin.closeRegistrations}
                </Button>
              ) : (
                <Button variant="secondary" size="sm" loading={busy} onClick={() => void run(() => write(calls.reopenRegistrations(groupId)))}>
                  {copy.admin.reopenRegistrations}
                </Button>
              )}
              {!amParticipant && s === GroupStatus.Open && inviteCode && (
                <Link href={inviteUrl(groupId, inviteCode).replace(/^https?:\/\/[^/]+/, "")} className={buttonClass({ variant: "secondary", size: "sm" })}>
                  {copy.admin.iAlsoPlay}
                </Link>
              )}
            </div>
          )}
        </section>

        {/* sin cuenta */}
        <GhostsPanel
          groupId={groupId}
          participants={participants}
          canEdit={s !== GroupStatus.Revealed}
          canRemove={beforeDraw}
          saving={busy}
          onAdd={(name, w) => run(() => write(calls.addGhost(groupId, name, w)))}
          onRemove={(i) => run(() => write(calls.removeParticipant(groupId, i)))}
          onSaveWishlist={(i, w: Wishlist) => run(() => write(calls.updateWishlist(groupId, i, w)), copy.wishlist.saved)}
        />

        {/* exclusiones */}
        {s < GroupStatus.Drawn && (
          <div className="space-y-6">
            <ExclusionsEditor
              participants={participants}
              exclusions={exclusions}
              previous={previousForCheck}
              locked={!beforeDraw}
              saving={busy}
              onSave={(pairs: Exclusion[]) => run(() => write(calls.setExclusions(groupId, pairs)), copy.wishlist.saved)}
              onFeasibility={setFeasible}
            />
            {group.previousGroupId !== 0n && beforeDraw && (
              <label className="flex min-h-14 items-center justify-between gap-4 border-y border-line py-3">
                <span className="text-pretty">{copy.create.avoidPrevious}</span>
                <input
                  type="checkbox"
                  className="size-5 shrink-0 accent-ink"
                  checked={group.avoidPrevious}
                  disabled={busy}
                  onChange={(e) => void run(() => write(calls.setAvoidPrevious(groupId, e.target.checked)))}
                />
              </label>
            )}
          </div>
        )}

        {/* sorteo */}
        {s < GroupStatus.Drawn && (
          <section className="space-y-3" aria-label={copy.admin.draw}>
            {phase === "drawing" || s === GroupStatus.DrawRequested ? (
              <div className="flex items-center gap-3 rounded-md bg-surface p-5">
                <Spinner className="text-ink-soft" />
                <span>{copy.admin.drawing}</span>
              </div>
            ) : (
              <>
                <Button size="lg" fullWidth disabled={!everyoneIn || !feasible || busy} onClick={() => setConfirmDraw(true)}>
                  {copy.admin.draw}
                </Button>
                {!everyoneIn && <p className="text-center text-sm text-ink-soft">{copy.admin.drawDisabled}</p>}
              </>
            )}
            {s === GroupStatus.DrawRequested && phase !== "drawing" && (
              <Button variant="ghost" fullWidth onClick={() => void fetch(`/api/groups/${groupId}/draw`, { method: "POST" }).then(() => refresh())}>
                {copy.pwa.retry}
              </Button>
            )}
          </section>
        )}

        {s >= GroupStatus.Drawn && (
          <>
            <p className="flex items-start gap-2 text-lg text-pretty">
              <CheckIcon className="mt-1" />
              {s === GroupStatus.Revealed ? copy.admin.revealed : copy.admin.drawn}
            </p>

            <AfterDrawPanel group={group} />

            {s !== GroupStatus.Revealed && (
              <section className="space-y-3" aria-label={copy.admin.reveal}>
                {phase === "revealing" || s === GroupStatus.RevealRequested ? (
                  <div className="flex items-center gap-3 rounded-md bg-surface p-5">
                    <Spinner className="text-ink-soft" />
                    <span>{copy.admin.revealing}</span>
                  </div>
                ) : (
                  <Button size="lg" fullWidth disabled={!canRevealNow || busy} onClick={() => void doReveal()}>
                    {copy.admin.reveal}
                  </Button>
                )}
                <p className="text-center text-sm text-pretty text-ink-soft">
                  {canRevealNow ? copy.admin.revealHint : copy.admin.revealTooEarly(formatDateTimeLong(group.eventAt - REVEAL_GRACE))}
                </p>
                {s === GroupStatus.RevealRequested && phase !== "revealing" && (
                  <Button variant="ghost" fullWidth onClick={() => void fetch(`/api/groups/${groupId}/reveal`, { method: "POST" }).then(() => refresh())}>
                    {copy.pwa.retry}
                  </Button>
                )}
              </section>
            )}
            {s === GroupStatus.Revealed && (
              <Link href={`/g/${groupId}/revelacion`} className={buttonClass({ size: "lg", fullWidth: true })}>
                {copy.finalReveal.sub}
              </Link>
            )}
            <PayWithFollow groupId={groupId} compact />
          </>
        )}

        <section className="space-y-4">
          <GroupSummary group={group} />
          <AddToCalendar group={group} />
          {amParticipant && (
            <Link href={`/g/${groupId}`} className="link flex items-center justify-center gap-1 py-2">
              {copy.participant.reveal}
              <ChevronRightIcon className="size-4" />
            </Link>
          )}
        </section>

        <section className="space-y-2 border-t border-line pt-6">
          <Button variant="ghost" fullWidth loading={busy} onClick={() => void run(() => write(calls.setArchived(groupId, true)))}>
            {copy.admin.archive}
          </Button>
          <p className="text-center text-sm text-pretty text-ink-soft">{copy.admin.archiveHint}</p>
        </section>
      </div>

      <Sheet open={expectedOpen} onClose={() => setExpectedOpen(false)} title={copy.admin.changeExpected}>
        <form
          className="space-y-5 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(expectedDraft);
            if (!Number.isInteger(n) || n < 3) return;
            setExpectedOpen(false);
            void run(() => write(calls.setExpectedCount(groupId, n)));
          }}
        >
          <Field label={copy.create.expected} type="number" inputMode="numeric" min={Math.max(3, group.participantCount)} value={expectedDraft} onChange={(e) => setExpectedDraft(e.target.value)} hint={copy.create.expectedHint} />
          <Button type="submit" size="lg" fullWidth loading={busy}>
            {copy.wishlist.save}
          </Button>
        </form>
      </Sheet>

      <Sheet open={confirmDraw} onClose={() => setConfirmDraw(false)} title={copy.admin.draw}>
        <p className="mb-6 text-pretty">{copy.admin.drawConfirm}</p>
        <div className="flex gap-2 pb-2">
          <Button fullWidth onClick={() => void doDraw()}>
            {copy.common.yes}
          </Button>
          <Button fullWidth variant="secondary" onClick={() => setConfirmDraw(false)}>
            {copy.common.no}
          </Button>
        </div>
      </Sheet>
    </Page>
  );
}
