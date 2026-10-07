"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCavos } from "@cavos/kit/react";
import { LoginSheet } from "@/components/cavos/LoginSheet";
import { useWrite } from "@/components/cavos/useWrite";
import { useGroup } from "@/components/data/useGroup";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { AppHeader, Page } from "@/components/ui/AppHeader";
import { Button, buttonClass } from "@/components/ui/Button";
import { Field, TextArea } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { GroupSummary } from "./GroupSummary";
import { calls } from "@/lib/contract/calls";
import { readParticipantIndex, readWishlist } from "@/lib/contract/reads";
import { GroupStatus, emptyWishlist, type Wishlist } from "@/lib/contract/types";
import { copy } from "@/lib/copy/es-CR";
import { emailCommit, isValidEmail, newEmailNonce, normalizeEmail } from "@/lib/crypto/email";
import { ensureKeyPair } from "@/lib/crypto/keys";

export function InviteScreen({ groupId, inviteCode }: { groupId: bigint; inviteCode: bigint | null }) {
  const router = useRouter();
  const toast = useToast();
  const { isAuthenticated, isLoading, address, user } = useCavos();
  const { data, loading, notFound, error } = useGroup(groupId, { pollMs: 15_000 });
  const { write, busy, status } = useWrite();
  const [loginOpen, setLoginOpen] = useState(false);
  const [myIndex, setMyIndex] = useState<number | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wishlist, setWishlist] = useState<Wishlist>(emptyWishlist);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const wishlistTitleId = useId();

  const group = data?.group ?? null;
  const codeOk = useMemo(() => Boolean(group && inviteCode !== null && group.inviteCode === inviteCode), [group, inviteCode]);

  // prellenar nombre y correo con lo que trae el login (ajuste de estado durante el render)
  const [seenUser, setSeenUser] = useState(user);
  if (user !== seenUser) {
    setSeenUser(user);
    if (user?.email && !email) setEmail(user.email);
    if (user?.name && !name) setName(user.name);
  }

  useEffect(() => {
    if (!isAuthenticated || !address || !group) return;
    void readParticipantIndex(groupId, address).then(setMyIndex);
  }, [isAuthenticated, address, group, groupId]);

  // "repetir el próximo año": prellenar con la wishlist del año pasado
  const previousGroupId = group?.previousGroupId ?? 0n;
  useEffect(() => {
    if (previousGroupId === 0n || !address) return;
    void readParticipantIndex(previousGroupId, address)
      .then((prevIdx) => (prevIdx === null ? null : readWishlist(previousGroupId, prevIdx)))
      .then((w) => {
        if (w) setWishlist((cur) => (cur.ideas || cur.sizes || cur.links ? cur : w));
      });
  }, [previousGroupId, address]);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || inviteCode === null) return;
    if (!isAuthenticated || !address) {
      setLoginOpen(true);
      return;
    }
    const next: typeof errors = {};
    if (!name.trim()) next.name = copy.create.errors.name;
    if (!isValidEmail(email)) next.email = copy.invite.emailInvalid;
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      const kp = await ensureKeyPair(address);
      const nonce = newEmailNonce();
      const commit = emailCommit(email, nonce);
      await write(calls.join(groupId, inviteCode, name.trim(), kp.publicKey, commit, wishlist));
      await fetch("/api/participants/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ groupId: groupId.toString(), account: address, email: normalizeEmail(email), nonce }),
      }).catch(() => undefined);
      toast.show(copy.invite.done, "ok");
      router.replace(`/g/${groupId.toString()}`);
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
  if (notFound || !group || !codeOk) {
    return (
      <Page>
        <AppHeader backHref="/" />
        <p className="text-xl font-semibold text-balance">{error ? copy.common.error : copy.invite.notFound}</p>
      </Page>
    );
  }

  if (group.archived) {
    return (
      <Page>
        <AppHeader backHref="/" title={group.name} right={<Pill>{copy.status.archived}</Pill>} />
        <p className="text-lg text-pretty text-ink-soft">{copy.admin.archived}</p>
      </Page>
    );
  }

  const full = group.participantCount >= group.expectedCount;
  const closed = group.status !== GroupStatus.Open;

  return (
    <Page>
      <AppHeader backHref="/" title={copy.invite.title(group.name)} subtitle={copy.invite.sub} />

      <div className="space-y-12 pb-12">
        <GroupSummary group={group} />

        <InstallPrompt />

        {myIndex !== null && myIndex !== undefined ? (
          <div className="space-y-6">
            <p className="text-xl font-semibold">{copy.invite.joinedAlready}</p>
            <Link href={`/g/${groupId.toString()}`} className={buttonClass({ size: "lg", fullWidth: true })}>
              {copy.participant.reveal}
            </Link>
          </div>
        ) : closed ? (
          <p className="text-xl font-semibold text-balance">{copy.invite.closed}</p>
        ) : full ? (
          <p className="text-xl font-semibold text-balance">{copy.invite.full}</p>
        ) : !isAuthenticated ? (
          <div className="space-y-3">
            <Button size="lg" fullWidth loading={isLoading} onClick={() => setLoginOpen(true)}>
              {copy.auth.enter}
            </Button>
            <p className="text-center text-sm text-ink-soft">{copy.auth.enterWith}</p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={(e) => void join(e)} noValidate>
            <Field label={copy.invite.name} placeholder={copy.invite.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={40} required />
            <Field
              label={copy.invite.email}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              hint={!errors.email ? copy.invite.emailHint : undefined}
              required
            />
            <div role="group" aria-labelledby={wishlistTitleId} className="space-y-5 rounded-md bg-surface p-5">
              <h2 id={wishlistTitleId} className="text-lg font-semibold">
                {copy.wishlist.title}
              </h2>
              <TextArea label={copy.wishlist.ideas} placeholder={copy.wishlist.ideasPlaceholder} value={wishlist.ideas} onChange={(e) => setWishlist({ ...wishlist, ideas: e.target.value })} rows={3} maxLength={600} />
              <TextArea label={copy.wishlist.sizes} placeholder={copy.wishlist.sizesPlaceholder} value={wishlist.sizes} onChange={(e) => setWishlist({ ...wishlist, sizes: e.target.value })} rows={2} maxLength={200} />
              <TextArea label={copy.wishlist.links} placeholder={copy.wishlist.linksPlaceholder} value={wishlist.links} onChange={(e) => setWishlist({ ...wishlist, links: e.target.value })} rows={2} maxLength={600} />
            </div>
            <Button type="submit" size="lg" fullWidth loading={busy}>
              {busy ? (status === "pending" ? copy.common.txPending : copy.invite.submitting) : copy.invite.submit}
            </Button>
          </form>
        )}
      </div>

      <LoginSheet open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Page>
  );
}
