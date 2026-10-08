"use client";

import Link from "next/link";
import { useState } from "react";
import { useCavos } from "@cavos/kit/react";
import { LoginSheet } from "@/components/cavos/LoginSheet";
import { useMyGroups } from "@/components/data/useMyGroups";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { PayWithFollow } from "@/components/share/PayWithFollow";
import { Button, buttonClass } from "@/components/ui/Button";
import { Page } from "@/components/ui/AppHeader";
import { Pill } from "@/components/ui/Pill";
import { Spinner } from "@/components/ui/Spinner";
import { ChevronRightIcon } from "@/components/ui/icons";
import { GroupProgress } from "./GroupSummary";
import { copy } from "@/lib/copy/es-CR";
import { formatDateShort } from "@/lib/format";
import { fixMojibake } from "@/lib/text";

const row = "flex items-center gap-3 py-4 transition-opacity active:opacity-60";

export function HomeScreen() {
  const { isAuthenticated, isLoading, address, user, logout } = useCavos();
  const { groups, loading } = useMyGroups(isAuthenticated ? address : null);
  const [loginOpen, setLoginOpen] = useState(false);

  function salir() {
    logout();
    sessionStorage.removeItem("qmt:return-to");
    window.location.replace("/");
  }

  const active = groups?.filter((g) => !g.group.archived) ?? [];
  const archived = groups?.filter((g) => g.group.archived && g.isAdmin) ?? [];

  const session = isAuthenticated ? (
    <div className="space-y-12">
      <Link href="/nuevo" className={buttonClass({ size: "lg", fullWidth: true })}>
        {copy.home.create}
      </Link>

      <section aria-label={copy.home.yourGroups}>
        <h2 className="text-lg font-semibold">{copy.home.yourGroups}</h2>
        {loading && !groups ? (
          <Spinner className="mt-6 text-ink-soft" />
        ) : active.length === 0 ? (
          <p className="mt-2 text-pretty text-ink-soft">{copy.home.noGroups}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {active.map(({ group, isAdmin }) => (
              <li key={group.id.toString()}>
                <Link href={isAdmin ? `/g/${group.id}/admin` : `/g/${group.id}`} className={row}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{group.name}</p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {formatDateShort(group.eventAt)} · {copy.common.people(group.participantCount)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                      <GroupProgress status={group.status} compact />
                      {isAdmin && <Pill>{copy.home.adminBadge}</Pill>}
                    </div>
                  </div>
                  <ChevronRightIcon className="text-line-strong" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {archived.length > 0 && (
        <section aria-label={copy.home.archived}>
          <h2 className="text-lg font-semibold">{copy.home.archived}</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {archived.map(({ group }) => (
              <li key={group.id.toString()}>
                <Link href={`/g/${group.id}/admin`} className={row}>
                  <span className="min-w-0 flex-1 truncate text-ink-soft">{group.name}</span>
                  <Pill>{copy.status.archived}</Pill>
                  <ChevronRightIcon className="text-line-strong" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
        <p className="min-w-0 truncate text-sm text-ink-soft">{fixMojibake(user?.name) || user?.email || ""}</p>
        <Button variant="ghost" size="sm" className="-mr-4" onClick={salir}>
          {copy.auth.logout}
        </Button>
      </div>
    </div>
  ) : isLoading ? (
    <div className="flex items-center justify-center gap-2 py-6 text-ink-soft">
      <Spinner className="size-4" /> {copy.auth.connecting}
    </div>
  ) : (
    <div className="space-y-3">
      <Button size="lg" fullWidth onClick={() => setLoginOpen(true)}>
        {copy.auth.enter}
      </Button>
      <p className="text-center text-sm text-ink-soft">{copy.auth.enterWith}</p>
    </div>
  );

  return (
    <Page>
      <div className="flex flex-col gap-12 pb-6 pt-[max(3.5rem,calc(var(--safe-top)+2.5rem))]">
        <header>
          <h1 className="whitespace-pre-line text-3xl font-semibold">{copy.app.name.replace(" ", "\n")}</h1>
          <p className="mt-4 text-lg text-pretty text-ink-soft">{copy.home.sub}</p>
        </header>
        <InstallPrompt />
        {session}
        <div className="space-y-6">
          <PayWithFollow compact />
          <p className="text-center text-xs text-ink-soft">{copy.app.by}</p>
        </div>
      </div>
      <LoginSheet open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Page>
  );
}
