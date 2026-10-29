"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/session";
import { Page } from "@/components/ui/AppHeader";
import { Spinner } from "@/components/ui/Spinner";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { copy } from "@/lib/copy/es-CR";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending) return;
    if (session?.user) {
      const ret = sessionStorage.getItem("qmt:return-to") || "/dashboard";
      sessionStorage.removeItem("qmt:return-to");
      router.replace(ret);
    }
  }, [isPending, session, router]);

  if (isPending || session?.user) {
    return (
      <Page className="items-center justify-center">
        <Spinner className="size-8 text-ink-soft" />
        <p className="mt-4 text-ink-soft">{copy.auth.callbackWorking}</p>
      </Page>
    );
  }

  return (
    <Page className="items-center justify-center gap-4">
      <p className="text-pretty text-ink-soft">{copy.auth.callbackError}</p>
      <GoogleLoginButton callbackURL="/dashboard" />
    </Page>
  );
}
