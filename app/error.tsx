"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Un problème est survenu</h1>
      <p className="text-muted-foreground text-sm">
        Réessaie, ou reviens plus tard si ça persiste.
      </p>
      <Button onClick={reset}>Réessayer</Button>
    </main>
  );
}
