"use client";

import { Button } from "@/components/ui/Button";
import { copy } from "@/lib/copy/es-CR";
import { INSTAGRAM_APP_URL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/brand/links";
import { cn } from "@/lib/cn";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PayWithFollow({ compact = false, className }: { compact?: boolean; className?: string }) {
  const follow = () => {
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    if (isMobile) {
      const t = window.setTimeout(() => window.open(INSTAGRAM_URL, "_blank", "noopener"), 700);
      window.addEventListener("pagehide", () => window.clearTimeout(t), { once: true });
      window.location.href = INSTAGRAM_APP_URL;
    } else {
      window.open(INSTAGRAM_URL, "_blank", "noopener");
    }
  };

  return (
    <section className={cn("rounded-md bg-surface p-6", className)} aria-label={copy.pay.title}>
      <h2 className={cn("font-semibold", compact ? "text-base" : "text-lg")}>{copy.pay.title}</h2>
      <p className="mt-1 text-pretty text-ink-soft">{copy.pay.body}</p>
      <div className="mt-5 flex flex-col gap-2">
        <Button fullWidth variant={compact ? "secondary" : "primary"} leading={<InstagramIcon />} onClick={follow}>
          {copy.pay.follow} {INSTAGRAM_HANDLE}
        </Button>
      </div>
    </section>
  );
}
