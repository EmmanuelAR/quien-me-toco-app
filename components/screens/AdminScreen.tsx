"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSession } from "@/lib/auth/session";
import { ExclusionsEditor } from "@/components/admin/ExclusionsEditor";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { useGroup } from "@/components/data/useGroup";
import { AddToCalendar } from "@/components/share/AddToCalendar";
import { ShareInvite } from "@/components/share/ShareInvite";
import { AppHeader, Page } from "@/components/ui/AppHeader";
import { Button, buttonClass } from "@/components/ui/Button";
import { Field, TextArea } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { WishlistFillList } from "@/components/ui/WishlistFillList";
import { GroupProgress, GroupSummary } from "./GroupSummary";
import { api } from "@/lib/api/client";
import { MIN_PARTICIPANTS, type AppExclusion } from "@/lib/app/types";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy/es-CR";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/format";

type AdminTab = "invite" | "people" | "exclusions" | "more";

export function AdminScreen({ groupId, justCreated }: { groupId: string; justCreated: boolean }) {
  const toast = useToast();
  const { data: session, isPending: authPending } = useSession();
  const isAuthenticated = Boolean(session?.user);
  const { data: group, loading, notFound, error, refresh } = useGroup(groupId, { pollMs: 8_000 });
  const [busy, setBusy] = useState(false);
  const [feasible, setFeasible] = useState(true);
  const [confirmDraw, setConfirmDraw] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState<AdminTab>("invite");
  const [editForm, setEditForm] = useState({ name: "", when: "", place: "", budgetMax: "", rules: "" });

  const members = useMemo(() => group?.members ?? [], [group]);
  const exclusions = group?.exclusions ?? [];
  const isOwner = Boolean(group?.isOwner);
  const canDraw = (group?.participantCount ?? 0) >= MIN_PARTICIPANTS;
  const preDraw = group?.status === "open" || group?.status === "closed";

  const wishlistRows = members.map((m) => ({
    id: m.id,
    name: m.name,
    filled: Boolean(m.wishlist.ideas.trim() || m.wishlist.sizes.trim() || m.wishlist.links.trim()),
  }));

  const tabs = useMemo(
    () => [
      { id: "invite" as const, label: copy.admin.tabs.invite },
      { id: "people" as const, label: copy.admin.tabs.people },
      { id: "exclusions" as const, label: copy.admin.tabs.exclusions },
      { id: "more" as const, label: copy.admin.tabs.more },
    ],
    [],
  );

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try {
      await fn();
      await refresh();
      if (ok) toast.show(ok, "ok");
    } catch (e) {
      const code = (e as { code?: string }).code;
      toast.show(code === "infeasible" ? copy.admin.infeasible : copy.common.error, "error");
    } finally {
      setBusy(false);
    }
  };

  if (authPending || (loading && !group)) {
    return (
      <Page width="wide" className="items-center justify-center">
        <Spinner className="size-8 text-ink-soft" />
      </Page>
    );
  }

  if (!isAuthenticated) {
    return (
      <Page width="wide">
        <AppHeader backHref="/" title={copy.admin.title} />
        <p className="mb-6 text-pretty text-ink-soft">{copy.auth.needLogin}</p>
        <GoogleLoginButton callbackURL={`/g/${groupId}/admin`} />
      </Page>
    );
  }

  if (notFound || !group) {
    return (
      <Page width="wide">
        <AppHeader backHref="/dashboard" />
        <p className="text-xl font-semibold">{error ? copy.common.error : copy.common.notFound}</p>
      </Page>
    );
  }

  if (!isOwner) {
    return (
      <Page width="wide">
        <AppHeader backHref={`/g/${groupId}`} title={copy.admin.title} />
        <p className="text-pretty text-ink-soft">{copy.admin.onlyAdmin}</p>
        <Link href={`/g/${groupId}`} className={cn(buttonClass(), "mt-6")}>
          {copy.admin.iAlsoPlay}
        </Link>
      </Page>
    );
  }

  return (
    <Page width="wide">
      <AppHeader
        backHref="/dashboard"
        title={group.name}
        subtitle={copy.admin.title}
        right={group.archived ? <Pill>{copy.status.archived}</Pill> : undefined}
      />

      <div className="flex flex-col gap-8 pb-16">
        {justCreated && (
          <p className="rounded-lg bg-surface px-4 py-3 text-sm text-pretty">{copy.create.created}</p>
        )}

        <div className="space-y-6">
          <GroupProgress status={group.status} />
          <GroupSummary group={group} />
        </div>

        <Tabs tabs={tabs} value={tab} onChange={setTab} />

        <TabPanel id="invite" active={tab === "invite"} className="space-y-6">
          {preDraw && group.inviteToken && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">{copy.admin.share}</h2>
              <ShareInvite name={group.name} eventAt={group.eventAt} inviteToken={group.inviteToken} />
            </section>
          )}

          <AddToCalendar
            groupId={group.id}
            name={group.name}
            eventAt={group.eventAt}
            place={group.place}
            budgetMin={group.budgetMin}
            budgetMax={group.budgetMax}
            currency={group.currency}
          />

          {preDraw && (
            <div className="space-y-3">
              <Button
                size="lg"
                fullWidth
                disabled={busy || !canDraw || !feasible}
                onClick={() => setConfirmDraw(true)}
              >
                {copy.admin.draw}
              </Button>
              {!canDraw && <p className="text-sm text-ink-soft">{copy.admin.drawDisabled}</p>}
              {canDraw && <p className="text-sm text-ink-soft">{copy.admin.readyToDraw}</p>}
            </div>
          )}

          {group.status === "drawn" && (
            <Button
              size="lg"
              fullWidth
              disabled={busy}
              onClick={() =>
                void run(
                  () => api(`/api/groups/${groupId}/reveal`, { method: "POST" }),
                  copy.admin.revealed,
                )
              }
            >
              {copy.admin.reveal}
            </Button>
          )}

          {group.status === "revealed" && (
            <Link href={`/g/${groupId}/revelacion`} className={buttonClass({ size: "lg", fullWidth: true })}>
              {copy.finalReveal.title}
            </Link>
          )}
        </TabPanel>

        <TabPanel id="people" active={tab === "people"} className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">{copy.admin.registered}</h2>
            <p className="text-sm text-ink-soft">{copy.common.people(group.participantCount)}</p>
            {!canDraw && <p className="text-sm text-ink-soft">{copy.admin.needMin(MIN_PARTICIPANTS)}</p>}
            <ul className="divide-y divide-line border-y border-line">
              {members.map((m) => (
                <li key={m.id} className="flex min-h-12 items-center justify-between gap-2 py-2">
                  <span className="truncate">{m.name}</span>
                  {!m.userId && <Pill className="bg-white text-ink-soft">prueba</Pill>}
                </li>
              ))}
            </ul>
          </section>

          {preDraw && group.testTools && (
            <div className="space-y-2">
              <Button
                variant="secondary"
                fullWidth
                disabled={busy}
                onClick={() =>
                  void run(
                    () => api(`/api/groups/${groupId}/test-members`, { method: "POST" }),
                    copy.admin.addTestPeopleOk,
                  )
                }
              >
                {copy.admin.addTestPeople}
              </Button>
              <p className="text-sm text-ink-soft">{copy.admin.addTestPeopleHint}</p>
            </div>
          )}

          <WishlistFillList rows={wishlistRows} />
        </TabPanel>

        <TabPanel id="exclusions" active={tab === "exclusions"}>
          {preDraw ? (
            <ExclusionsEditor
              members={members}
              exclusions={exclusions}
              locked={false}
              saving={busy}
              onFeasibility={setFeasible}
              onSave={(pairs: AppExclusion[]) =>
                run(
                  () =>
                    api(`/api/groups/${groupId}/exclusions`, {
                      method: "PUT",
                      body: JSON.stringify({ pairs }),
                    }),
                  copy.admin.exclusionsSave,
                )
              }
            />
          ) : (
            <p className="text-pretty text-ink-soft">{copy.admin.exclusionsLocked}</p>
          )}
        </TabPanel>

        <TabPanel id="more" active={tab === "more"} className="space-y-2">
          {preDraw && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setEditForm({
                  name: group.name,
                  when: toDatetimeLocalValue(group.eventAt),
                  place: group.place,
                  budgetMax: String(group.budgetMax),
                  rules: group.rules,
                });
                setEditOpen(true);
              }}
            >
              {copy.admin.edit}
            </Button>
          )}
          <Button
            variant="ghost"
            fullWidth
            disabled={busy}
            onClick={() =>
              void run(() =>
                api(`/api/groups/${groupId}`, {
                  method: "PATCH",
                  body: JSON.stringify({ archived: !group.archived }),
                }),
              )
            }
          >
            {group.archived ? copy.admin.unarchive : copy.admin.archive}
          </Button>
        </TabPanel>
      </div>

      <Sheet open={confirmDraw} onClose={() => setConfirmDraw(false)} title={copy.admin.draw}>
        <p className="text-pretty text-ink-soft">{copy.admin.drawConfirm}</p>
        <Button
          className="mt-6"
          size="lg"
          fullWidth
          disabled={busy}
          onClick={() => {
            setConfirmDraw(false);
            void (async () => {
              setBusy(true);
              try {
                const res = await api<{
                  emails?: { configured?: boolean; sent?: number; skipped?: number };
                }>(`/api/groups/${groupId}/draw`, { method: "POST" });
                await refresh();
                const em = res.emails;
                if (em?.configured && typeof em.sent === "number") {
                  toast.show(copy.admin.drawnEmails(em.sent, em.skipped ?? 0), "ok");
                } else {
                  toast.show(copy.admin.drawn, "ok");
                }
              } catch (e) {
                const code = (e as { code?: string }).code;
                toast.show(code === "infeasible" ? copy.admin.infeasible : copy.common.error, "error");
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          {copy.admin.draw}
        </Button>
      </Sheet>

      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title={copy.admin.editTitle}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await api(`/api/groups/${groupId}`, {
                method: "PATCH",
                body: JSON.stringify({
                  name: editForm.name,
                  eventAt: new Date(fromDatetimeLocalValue(editForm.when) * 1000).toISOString(),
                  place: editForm.place,
                  budgetMax: Number(editForm.budgetMax) || 0,
                  rules: editForm.rules,
                }),
              });
              setEditOpen(false);
            }, copy.admin.editSave);
          }}
        >
          <Field label={copy.create.name} value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
          <Field label={copy.create.when} type="datetime-local" value={editForm.when} onChange={(e) => setEditForm((f) => ({ ...f, when: e.target.value }))} />
          <Field label={copy.create.place} value={editForm.place} onChange={(e) => setEditForm((f) => ({ ...f, place: e.target.value }))} />
          <Field label={copy.create.budgetMax} value={editForm.budgetMax} onChange={(e) => setEditForm((f) => ({ ...f, budgetMax: e.target.value }))} />
          <TextArea label={copy.create.rules} value={editForm.rules} onChange={(e) => setEditForm((f) => ({ ...f, rules: e.target.value }))} rows={3} />
          <Button type="submit" fullWidth disabled={busy}>
            {copy.admin.editSave}
          </Button>
        </form>
      </Sheet>
    </Page>
  );
}
