"use client";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Marker } from "@/components/ui/Marker";
import { copy } from "@/lib/copy/es-CR";
import { useLogin } from "./useLogin";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4.1-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4.1 3.1A7.2 7.2 0 0 1 12 4.8z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <path d="M16.7 12.7c0-2.5 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.3.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.8-1.1-2.8-4.2zM14.3 5.4c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1.1 3 1.1.1 2.3-.6 3-1.4z" />
    </svg>
  );
}

export interface LoginSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function LoginSheet({ open, onClose, title }: LoginSheetProps) {
  const { login, starting, authError } = useLogin();
  return (
    <Sheet open={open} onClose={onClose} title={title ?? copy.auth.enter}>
      <p className="mb-5 text-ink-soft">
        <Marker>{copy.auth.enterWith}</Marker>
      </p>
      <div className="space-y-2">
        <Button
          fullWidth
          size="lg"
          variant="secondary"
          leading={<GoogleIcon />}
          loading={starting === "google"}
          onClick={() => void login("google")}
        >
          google
        </Button>
        <Button
          fullWidth
          size="lg"
          leading={<AppleIcon />}
          loading={starting === "apple"}
          onClick={() => void login("apple")}
        >
          apple
        </Button>
      </div>
      {authError && (
        <p className="mt-4 text-sm">
          <Marker tone="pink">{copy.auth.callbackError}</Marker>
        </p>
      )}
      <p className="mt-5 text-xs text-ink-soft">{copy.app.by}</p>
    </Sheet>
  );
}
