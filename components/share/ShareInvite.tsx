"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { copy } from "@/lib/copy/es-CR";
import { inviteCodeToSlug } from "@/lib/contract/calls";
import { appUrl } from "@/lib/brand/links";
import type { Group } from "@/lib/contract/types";
import { formatDate } from "@/lib/format";

export function inviteUrl(group: Group): string {
  return appUrl(`/i/${group.id.toString()}/${inviteCodeToSlug(group.inviteCode)}`);
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4.1c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z" />
    </svg>
  );
}

/** compartir el link de invitación por whatsapp (con vista previa) o copiarlo */
export function ShareInvite({ group }: { group: Group }) {
  const toast = useToast();
  const url = inviteUrl(group);
  const text = `te invito a "${group.name}": amigo secreto el ${formatDate(group.eventAt)}. apuntate aquí: ${url}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: copy.app.name, text, url });
        return;
      } catch {
        /* cancelado: seguimos a whatsapp */
      }
    }
    window.open(wa, "_blank", "noopener");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast.show(copy.invite.copied, "blue");
  };

  return (
    <div className="flex flex-col gap-2">
      <Button fullWidth leading={<WhatsAppIcon />} onClick={() => void share()}>
        {copy.invite.whatsapp}
      </Button>
      <Button fullWidth variant="secondary" onClick={() => void copyLink()}>
        {copy.invite.copyLink}
      </Button>
    </div>
  );
}
