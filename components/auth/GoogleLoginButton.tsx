"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { signInWithGoogle } from "@/lib/auth/client";
import { copy } from "@/lib/copy/es-CR";

export function GoogleLoginButton({
  callbackURL = "/dashboard",
  fullWidth = true,
  size = "lg",
}: {
  callbackURL?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle(callbackURL);
    } catch (e) {
      console.error(e);
      setError(copy.common.error);
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button size={size} fullWidth={fullWidth} onClick={() => void onClick()} disabled={busy}>
        {busy ? <Spinner className="size-5" /> : copy.auth.google}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
