"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/client";
import { Button } from "@/components/ui/Button";
import { copy } from "@/lib/copy/es-CR";
import { cn } from "@/lib/cn";
import { fixMojibake } from "@/lib/text";

export function AppBar() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const isAuthenticated = Boolean(user);
  const onDashboard = pathname === "/dashboard" || pathname === "/crear" || pathname === "/nuevo";

  function salir() {
    sessionStorage.removeItem("qmt:return-to");
    void signOut("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur-md">
      <div className="safe-x safe-top mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 lg:h-16 lg:px-2">
        <div className="flex min-w-0 items-center gap-6">
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="truncate text-base font-semibold tracking-tight">
            {copy.app.name}
          </Link>
          {isAuthenticated && (
            <nav className="hidden items-center gap-4 text-sm sm:flex" aria-label="Principal">
              <Link
                href="/dashboard"
                className={cn(
                  "transition-colors hover:text-ink",
                  onDashboard ? "font-semibold text-ink" : "text-ink-soft",
                )}
              >
                {copy.home.title}
              </Link>
              <Link href="/nuevo" className="text-ink-soft transition-colors hover:text-ink">
                {copy.home.create}
              </Link>
            </nav>
          )}
        </div>

        {!isPending && isAuthenticated && (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <p className="hidden max-w-48 truncate text-sm text-ink-soft md:block">
              {fixMojibake(user?.name) || user?.email || ""}
            </p>
            <Button variant="ghost" size="sm" onClick={salir}>
              {copy.auth.logout}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
