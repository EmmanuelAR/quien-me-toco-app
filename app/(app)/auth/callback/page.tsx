"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCavos } from "@cavos/kit/react";
import { takeReturnPath } from "@/components/cavos/useLogin";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { copy } from "@/lib/copy/es-CR";

/**
 * aquí vuelve el oauth de cavos (?cavos_auth_code=…). el provider procesa el código
 * solo al montar; nosotros esperamos a estar autenticados y volvemos a donde estaba
 * la persona (link de invitación, grupo, inicio).
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, authError } = useCavos();
  const [returnTo] = useState(() => takeReturnPath());
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setWaited(true), 20_000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isAuthenticated) router.replace(returnTo);
  }, [isAuthenticated, returnTo, router]);

  const failed = Boolean(authError) || (waited && !isLoading && !isAuthenticated);

  return (
    <main className="safe-x safe-top safe-bottom mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center text-center">
      {failed ? (
        <>
          <p className="text-xl font-semibold text-balance">{copy.auth.callbackError}</p>
          <Button size="lg" className="mt-8" onClick={() => router.replace(returnTo)}>
            {copy.common.back}
          </Button>
        </>
      ) : (
        <>
          <Spinner className="size-8 text-ink-soft" />
          <p className="mt-4 text-pretty text-ink-soft">{copy.auth.callbackWorking}</p>
        </>
      )}
    </main>
  );
}
