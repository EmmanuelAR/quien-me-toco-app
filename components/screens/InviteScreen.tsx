"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/session";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { AppHeader, Page } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api/client";
import { copy } from "@/lib/copy/es-CR";
import { capitalize, formatDate } from "@/lib/format";

type InviteInfo = {
  id: string;
  name: string;
  eventAt: number;
  place: string;
  status: string;
  participantCount: number;
  open: boolean;
  signedIn: boolean;
  alreadyMember: boolean;
};

export function InviteScreen({ token }: { token: string }) {
  const router = useRouter();
  const toast = useToast();
  const { data: session, isPending } = useSession();
  const isAuthenticated = Boolean(session?.user);
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api<InviteInfo>(`/api/invite/${encodeURIComponent(token)}`)
      .then(setInfo)
      .catch(() => setError(true));
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session?.user?.name]);

  useEffect(() => {
    if (info?.alreadyMember) router.replace(`/g/${info.id}`);
  }, [info, router]);

  const join = async () => {
    setBusy(true);
    try {
      const res = await api<{ groupId: string }>("/api/groups/join", {
        method: "POST",
        body: JSON.stringify({ token, name: name.trim() || undefined }),
      });
      router.replace(`/g/${res.groupId}`);
    } catch (e) {
      toast.show((e as Error).message || copy.common.error, "error");
      setBusy(false);
    }
  };

  if (error) {
    return (
      <Page>
        <AppHeader backHref="/" />
        <p className="text-xl font-semibold">{copy.common.notFound}</p>
      </Page>
    );
  }

  if (!info || isPending) {
    return (
      <Page className="items-center justify-center">
        <Spinner className="size-8 text-ink-soft" />
      </Page>
    );
  }

  if (info.alreadyMember) {
    return (
      <Page className="items-center justify-center">
        <Spinner className="size-8 text-ink-soft" />
      </Page>
    );
  }

  return (
    <Page>
      <AppHeader backHref="/" title={copy.invite.title(info.name)} />
      <div className="flex flex-col gap-6 pb-12">
        <p className="text-lg text-pretty text-ink-soft">
          {capitalize(formatDate(info.eventAt, { withTime: true }))}
          {info.place ? ` · ${info.place}` : ""}
        </p>
        <p className="text-sm text-ink-soft">{copy.common.people(info.participantCount)}</p>

        {!info.open ? (
          <p className="text-pretty text-ink-soft">{copy.invite.closed}</p>
        ) : !isAuthenticated ? (
          <>
            <p className="text-pretty text-ink-soft">{copy.auth.needLogin}</p>
            <GoogleLoginButton callbackURL={`/i/${encodeURIComponent(token)}`} />
          </>
        ) : (
          <>
            <Field
              label={copy.invite.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Button size="lg" fullWidth disabled={busy || !name.trim()} onClick={() => void join()}>
              {busy ? <Spinner className="size-5" /> : copy.invite.submit}
            </Button>
          </>
        )}
      </div>
    </Page>
  );
}
