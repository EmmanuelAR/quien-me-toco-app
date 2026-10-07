"use client";

import Link from "next/link";
import { useState } from "react";
import { useCavos } from "@cavos/kit/react";
import { LoginSheet } from "@/components/cavos/LoginSheet";
import { useMyGroups } from "@/components/data/useMyGroups";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { PayWithFollow } from "@/components/share/PayWithFollow";
import { Button } from "@/components/ui/Button";
import { Marker } from "@/components/ui/Marker";
import { Page } from "@/components/ui/AppHeader";
import { Pill } from "@/components/ui/Pill";
import { Spinner } from "@/components/ui/Spinner";
import { StatusPill } from "./GroupSummary";
import { copy } from "@/lib/copy/es-CR";
import { formatDateShort } from "@/lib/format";

export function HomeScreen() {
  const { isAuthenticated, isLoading, address, user, logout } = useCavos();
  const { groups, loading } = useMyGroups(isAuthenticated ? address : null);
  const [loginOpen, setLoginOpen] = useState(false);

  const session = isLoading ? (
    <div className="flex items-center justify-center gap-2 py-6 text-ink-soft">
      <Spinner className="size-4" /> {copy.auth.connecting}
    </div>
  ) : !isAuthenticated ? (
    <div className="space-y-3">
      <Button size="lg" fullWidth onClick={() => setLoginOpen(true)}>
        {copy.auth.enter}
      </Button>
      <p className="text-center text-sm text-ink-soft">{copy.auth.enterWith}</p>
    </div>
  ) : (
    <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm text-ink-soft">
              {user?.name ? user.name.toLowerCase() : user?.email ?? ""}
            </p>
            <Button variant="ghost" className="h-9 px-3" onClick={logout}>
              {copy.auth.logout}
            </Button>
          </div>

          <Link
            href="/nuevo"
            className="flex h-14 items-center justify-center rounded-pill bg-ink px-6 text-lg font-medium text-white active:scale-[0.98]"
          >
            {copy.home.create}
          </Link>

          <section aria-label={copy.home.yourGroups}>
            <h2 className="mb-3 text-lg font-semibold">{copy.home.yourGroups}</h2>
            {loading && !groups ? (
              <Spinner />
            ) : !groups || groups.length === 0 ? (
              <p className="text-ink-soft">{copy.home.noGroups}</p>
            ) : (
              <ul className="space-y-2">
                {groups.map(({ group, isAdmin }) => (
                  <li key={group.id.toString()}>
                    <Link
                      href={isAdmin ? `/g/${group.id}/admin` : `/g/${group.id}`}
                      className="block rounded-md border border-line bg-white p-4 shadow-card active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{group.name}</p>
                          <p className="text-sm text-ink-soft">
                            {formatDateShort(group.eventAt)} · {copy.common.people(group.participantCount)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <StatusPill status={group.status} />
                          {isAdmin && <Pill tone="pink">{copy.home.adminBadge}</Pill>}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
    </div>
  );

  return (
    <Page>
      <div className="flex flex-col gap-8 pt-[max(2rem,calc(var(--safe-top)+1.25rem))]">
        <header>
          <h1 className="flex flex-col items-start gap-2 text-2xl font-semibold leading-tight">
            <span>{copy.home.heroA}</span>
            <Marker>{copy.home.heroB}</Marker>
          </h1>
          <p className="mt-4 text-ink-soft">{copy.home.sub}</p>
        </header>
        <InstallPrompt />
        {session}
        <PayWithFollow compact />
        <p className="-mt-4 text-center text-xs text-ink-soft">{copy.app.by}</p>
      </div>
      <LoginSheet open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Page>
  );
}
