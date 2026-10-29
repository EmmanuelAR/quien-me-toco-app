"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth/session";
import { signInWithGoogle } from "@/lib/auth/client";
import { useMyGroups } from "@/components/data/useMyGroups";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { buttonClass } from "@/components/ui/Button";
import { Page } from "@/components/ui/AppHeader";
import { Pill } from "@/components/ui/Pill";
import { GroupListSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { ChevronRightIcon } from "@/components/ui/icons";
import { GroupProgress } from "./GroupSummary";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy/es-CR";
import { formatDateShort } from "@/lib/format";
import type { MyGroup } from "@/components/data/useMyGroups";

const row = "flex items-center gap-3 py-4 transition-opacity active:opacity-60";

function GroupRow({
  item,
  view,
}: {
  item: MyGroup;
  /** From "Participo", open the member view even if the user also organizes. */
  view: "admin" | "participant";
}) {
  const { group, isAdmin, isParticipant } = item;
  const href = view === "admin" && isAdmin ? `/g/${group.id}/admin` : `/g/${group.id}`;
  const badge =
    isAdmin && isParticipant
      ? copy.home.bothBadge
      : isAdmin
        ? copy.home.adminBadge
        : copy.home.participantBadge;

  return (
    <li>
      <Link href={href} className={row}>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{group.name}</p>
          <p className="mt-0.5 text-sm text-ink-soft">
            {formatDateShort(group.eventAt)} · {copy.common.people(group.participantCount)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <GroupProgress status={group.status} compact />
            <Pill>{badge}</Pill>
          </div>
        </div>
        <ChevronRightIcon className="text-line-strong" />
      </Link>
    </li>
  );
}

function GroupSection({
  title,
  items,
  empty,
  loading,
  view,
}: {
  title: string;
  items: MyGroup[];
  empty: string;
  loading: boolean;
  view: "admin" | "participant";
}) {
  return (
    <section aria-label={title} className="min-w-0">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {loading ? (
        <GroupListSkeleton />
      ) : items.length === 0 ? (
        <p className="mt-2 text-pretty text-ink-soft">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {items.map((item) => (
            <GroupRow key={`${view}-${item.group.id}`} item={item} view={view} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function DashboardScreen() {
  const { data: session, isPending } = useSession();
  const isAuthenticated = Boolean(session?.user);
  const { groups, loading } = useMyGroups(isAuthenticated);
  const autoStarted = useRef(false);

  useEffect(() => {
    if (isPending || isAuthenticated || autoStarted.current) return;
    autoStarted.current = true;
    void signInWithGoogle("/dashboard").catch(() => {
      autoStarted.current = false;
    });
  }, [isPending, isAuthenticated]);

  const active = groups?.filter((g) => !g.group.archived) ?? [];
  const organizing = active.filter((g) => g.isAdmin);
  // Include hosts who also joined as members (role "both"); the old
  // `!g.isAdmin` filter hid those from "Participo" even with the badge.
  const participating = active.filter((g) => g.isParticipant);
  const archived = groups?.filter((g) => g.group.archived && g.isAdmin) ?? [];
  const listLoading = loading && !groups;
  const showInstall = isAuthenticated && active.length > 0;

  return (
    <Page width="wide">
      <div className="flex flex-col gap-12 py-8 lg:gap-16 lg:py-12">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">{copy.home.title}</h1>
            <p className="mt-4 max-w-xl text-lg text-pretty text-ink-soft">{copy.home.sub}</p>
          </div>
          {isAuthenticated && (
            <Link
              href="/nuevo"
              className={cn(buttonClass({ size: "lg", fullWidth: true }), "shrink-0 lg:w-auto lg:min-w-56")}
            >
              {copy.home.create}
            </Link>
          )}
        </header>

        {!isAuthenticated ? (
          <div className="flex flex-col items-center gap-4 py-6 text-ink-soft">
            {isPending ? (
              <>
                <Spinner className="size-8" />
                <p>{copy.common.loading}</p>
              </>
            ) : (
              <>
                <p className="text-center text-pretty">{copy.auth.needLogin}</p>
                <GoogleLoginButton callbackURL="/dashboard" />
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-12 lg:grid lg:grid-cols-2 lg:gap-x-12 lg:gap-y-14 xl:gap-x-16">
            <GroupSection
              title={copy.home.organizing}
              items={organizing}
              empty={copy.home.noOrganizing}
              loading={listLoading}
              view="admin"
            />
            <GroupSection
              title={copy.home.participating}
              items={participating}
              empty={copy.home.noParticipating}
              loading={listLoading}
              view="participant"
            />
            {archived.length > 0 && (
              <div className="lg:col-span-2">
                <GroupSection
                  title={copy.home.archived}
                  items={archived}
                  empty=""
                  loading={false}
                  view="admin"
                />
              </div>
            )}
          </div>
        )}

        {showInstall && <InstallPrompt />}
      </div>
    </Page>
  );
}
