"use client";

import { useState } from "react";
import { Button } from "./Button";
import { TextArea } from "./Field";
import { Pill } from "./Pill";
import { copy } from "@/lib/copy/es-CR";
import { cn } from "@/lib/cn";
import type { Wishlist } from "@/lib/contract/types";

export interface WishlistCardProps {
  title: string;
  wishlist: Wishlist;
  editable?: boolean;
  live?: boolean;
  saving?: boolean;
  onSave?: (next: Wishlist) => Promise<void> | void;
  className?: string;
}

function isEmpty(w: Wishlist) {
  return !w.ideas.trim() && !w.sizes.trim() && !w.links.trim();
}

function parseLinks(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function WishlistCard({
  title,
  wishlist,
  editable = false,
  live = false,
  saving = false,
  onSave,
  className,
}: WishlistCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Wishlist>(wishlist);

  const startEdit = () => {
    setDraft(wishlist);
    setEditing(true);
  };

  const save = async () => {
    await onSave?.({ ideas: draft.ideas.trim(), sizes: draft.sizes.trim(), links: draft.links.trim() });
    setEditing(false);
  };

  return (
    <section className={cn("rounded-md bg-surface p-6", className)} aria-label={title}>
      <header className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-lg font-semibold text-balance break-words">{title}</h3>
          {editable && !editing && (
            <Button variant="ghost" size="sm" className="-mr-3 -mt-2" onClick={startEdit}>
              {copy.wishlist.edit}
            </Button>
          )}
        </div>
        {live && !editing && <Pill className="mt-2 bg-white">{copy.wishlist.updatedLive}</Pill>}
      </header>

      {editing ? (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <TextArea
            label={copy.wishlist.ideas}
            placeholder={copy.wishlist.ideasPlaceholder}
            value={draft.ideas}
            onChange={(e) => setDraft({ ...draft, ideas: e.target.value })}
            rows={3}
            maxLength={600}
          />
          <TextArea
            label={copy.wishlist.sizes}
            placeholder={copy.wishlist.sizesPlaceholder}
            value={draft.sizes}
            onChange={(e) => setDraft({ ...draft, sizes: e.target.value })}
            rows={2}
            maxLength={200}
          />
          <TextArea
            label={copy.wishlist.links}
            placeholder={copy.wishlist.linksPlaceholder}
            value={draft.links}
            onChange={(e) => setDraft({ ...draft, links: e.target.value })}
            rows={2}
            maxLength={600}
          />
          <div className="flex gap-2">
            <Button type="submit" loading={saving}>
              {saving ? copy.wishlist.saving : copy.wishlist.save}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              {copy.wishlist.cancel}
            </Button>
          </div>
        </form>
      ) : isEmpty(wishlist) ? (
        <p className="text-ink-soft">{copy.wishlist.empty}</p>
      ) : (
        <dl className="space-y-4">
          {wishlist.ideas && (
            <div>
              <dt className="text-sm text-ink-soft">{copy.wishlist.ideas}</dt>
              <dd className="mt-0.5 whitespace-pre-wrap break-words">{wishlist.ideas}</dd>
            </div>
          )}
          {wishlist.sizes && (
            <div>
              <dt className="text-sm text-ink-soft">{copy.wishlist.sizes}</dt>
              <dd className="mt-0.5 whitespace-pre-wrap break-words">{wishlist.sizes}</dd>
            </div>
          )}
          {wishlist.links && (
            <div>
              <dt className="text-sm text-ink-soft">{copy.wishlist.links}</dt>
              <dd className="mt-0.5 space-y-1">
                {parseLinks(wishlist.links).map((l) => (
                  <a
                    key={l}
                    href={/^https?:\/\//i.test(l) ? l : `https://${l}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link block truncate"
                  >
                    {l}
                  </a>
                ))}
              </dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}
