"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, TextArea } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { WishlistCard } from "@/components/ui/WishlistCard";
import { readWishlist } from "@/lib/contract/reads";
import { emptyWishlist, type Participant, type Wishlist } from "@/lib/contract/types";
import { copy } from "@/lib/copy/es-CR";

export interface GhostsPanelProps {
  groupId: bigint;
  participants: Participant[];
  canEdit: boolean;
  canRemove: boolean;
  saving: boolean;
  onAdd: (name: string, wishlist: Wishlist) => Promise<void>;
  onRemove: (index: number) => Promise<void>;
  onSaveWishlist: (index: number, wishlist: Wishlist) => Promise<void>;
}

/** participantes sin cuenta: la abuela y compañía. la admin los agrega y les llena la wishlist. */
export function GhostsPanel({ groupId, participants, canEdit, canRemove, saving, onAdd, onRemove, onSaveWishlist }: GhostsPanelProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [wishlist, setWishlist] = useState<Wishlist>(emptyWishlist);
  const [editing, setEditing] = useState<{ index: number; wishlist: Wishlist } | null>(null);

  const ghosts = participants.filter((p) => p.isGhost);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onAdd(name.trim(), wishlist);
    setName("");
    setWishlist(emptyWishlist);
    setOpen(false);
  };

  const openEditor = async (p: Participant) => {
    const w = await readWishlist(groupId, p.index);
    setEditing({ index: p.index, wishlist: w });
  };

  return (
    <section className="space-y-4" aria-label={copy.admin.ghostsTitle}>
      <div>
        <h2 className="text-lg font-semibold">{copy.admin.ghostsTitle}</h2>
        <p className="mt-1 text-sm text-pretty text-ink-soft">{copy.admin.ghostHint}</p>
      </div>
      {ghosts.length > 0 && (
        <ul className="divide-y divide-line border-y border-line">
          {ghosts.map((p) => (
            <li key={p.index} className="flex min-h-14 items-center justify-between gap-2">
              <span className="min-w-0 truncate">{p.name}</span>
              <span className="-mr-4 flex shrink-0">
                {canEdit && (
                  <Button variant="ghost" size="sm" onClick={() => void openEditor(p)}>
                    {copy.admin.ghostWishlist}
                  </Button>
                )}
                {canRemove && (
                  <Button variant="ghost" size="sm" onClick={() => void onRemove(p.index)} disabled={saving} aria-label={copy.admin.removePerson(p.name)}>
                    {copy.admin.remove}
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canRemove && (
        <Button variant="secondary" fullWidth onClick={() => setOpen(true)}>
          {copy.admin.addGhost}
        </Button>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={copy.admin.addGhost}>
        <form className="space-y-5 pb-2" onSubmit={(e) => void submit(e)}>
          <Field label={copy.admin.ghostName} value={name} onChange={(e) => setName(e.target.value)} placeholder={copy.admin.ghostPlaceholder} maxLength={40} required />
          <TextArea label={copy.wishlist.ideas} value={wishlist.ideas} onChange={(e) => setWishlist({ ...wishlist, ideas: e.target.value })} placeholder={copy.wishlist.ideasPlaceholder} rows={2} maxLength={600} />
          <TextArea label={copy.wishlist.sizes} value={wishlist.sizes} onChange={(e) => setWishlist({ ...wishlist, sizes: e.target.value })} placeholder={copy.wishlist.sizesPlaceholder} rows={1} maxLength={200} />
          <Button type="submit" size="lg" fullWidth loading={saving}>
            {copy.admin.ghostAdd}
          </Button>
        </form>
      </Sheet>

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={copy.admin.ghostWishlist}>
        {editing && (
          <div className="pb-2">
            <WishlistCard
              title={participants[editing.index]?.name ?? ""}
              wishlist={editing.wishlist}
              editable
              saving={saving}
              onSave={async (w) => {
                await onSaveWishlist(editing.index, w);
                setEditing(null);
              }}
            />
          </div>
        )}
      </Sheet>
    </section>
  );
}
