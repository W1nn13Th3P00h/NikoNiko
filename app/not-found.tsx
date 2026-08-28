import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <p className="text-muted-foreground text-sm">
        Cette page n&apos;existe pas ou plus.
      </p>
      <Link href="/" className={buttonVariants()}>
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
