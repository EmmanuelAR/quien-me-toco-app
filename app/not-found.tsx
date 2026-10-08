import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { copy } from "@/lib/copy/es-CR";

export default function NotFound() {
  return (
    <main className="safe-x safe-top safe-bottom mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-xl text-pretty text-ink-soft">{copy.common.notFound}</p>
      <Link href="/" className={`${buttonClass({ size: "lg" })} mt-8`}>
        {copy.common.back}
      </Link>
    </main>
  );
}
