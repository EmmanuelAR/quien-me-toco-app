"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Marker } from "@/components/ui/Marker";
import { useToast } from "@/components/ui/Toast";
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

export interface PayWithFollowProps {
  /** grupo para la imagen de la historia; sin grupo, solo el botón de follow */
  groupId?: bigint;
  compact?: boolean;
  className?: string;
}

/**
 * la app no cobra. el "pago" es un follow a @ear.dev y una historia.
 * "subir una historia" genera la imagen 1080×1920 y la comparte con la web share api
 * (instagram aparece como destino en el celular). si no se puede, la descarga.
 */
export function PayWithFollow({ groupId, compact = false, className }: PayWithFollowProps) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const follow = () => {
    // en el celular probamos la app; si no está, el navegador cae al link web
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    if (isMobile) {
      const t = window.setTimeout(() => window.open(INSTAGRAM_URL, "_blank", "noopener"), 700);
      window.addEventListener("pagehide", () => window.clearTimeout(t), { once: true });
      window.location.href = INSTAGRAM_APP_URL;
    } else {
      window.open(INSTAGRAM_URL, "_blank", "noopener");
    }
  };

  const story = async () => {
    if (groupId === undefined) return;
    setBusy(true);
    try {
      const res = await fetch(`/g/${groupId.toString()}/historia`);
      const blob = await res.blob();
      const file = new File([blob], "quien-me-toco-historia.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: copy.app.name, text: `gracias ${INSTAGRAM_HANDLE}` });
        toast.show(copy.pay.storyHint, "blue");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      await navigator.clipboard.writeText(INSTAGRAM_HANDLE).catch(() => undefined);
      toast.show(copy.pay.storyFallback, "blue");
    } catch {
      toast.show(copy.common.error, "pink");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className={cn("relative rounded-md border border-line bg-white p-5 shadow-card", className)}
      aria-label={copy.pay.title}
    >
      <h3 className={cn("font-semibold", compact ? "text-base" : "text-lg")}>
        <Marker tone="pink">{copy.pay.title}</Marker>
      </h3>
      <p className="mt-2 text-pretty text-ink-soft">{copy.pay.body}</p>
      <div className="mt-4 flex flex-col gap-2">
        <Button fullWidth leading={<InstagramIcon />} onClick={follow}>
          {copy.pay.follow}
        </Button>
        {groupId !== undefined && (
          <Button fullWidth variant="secondary" loading={busy} onClick={() => void story()}>
            {copy.pay.story}
          </Button>
        )}
      </div>
    </section>
  );
}
