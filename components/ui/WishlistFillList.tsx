"use client";

import { Pill } from "@/components/ui/Pill";
import { copy } from "@/lib/copy/es-CR";

export type WishlistFillRow = { id: string; name: string; filled: boolean };

export function WishlistFillList({
  title = copy.admin.wishlistStatus,
  rows,
}: {
  title?: string;
  rows: WishlistFillRow[];
}) {
  return (
    <section className="space-y-3" aria-label={title}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">{copy.admin.missing(0)}</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((r) => (
            <li key={r.id} className="flex min-h-14 items-center justify-between gap-3">
              <span className="min-w-0 truncate">{r.name}</span>
              <Pill className={r.filled ? "bg-surface" : "bg-white text-ink-soft"}>
                {r.filled ? copy.admin.wishlistFilled : copy.admin.wishlistEmpty}
              </Pill>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
