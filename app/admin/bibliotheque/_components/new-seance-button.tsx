"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBlankLibrarySeance } from "../actions";

export function NewSeanceButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      onClick={() =>
        startTransition(async () => {
          const id = await createBlankLibrarySeance();
          if (id) router.push(`/admin/bibliotheque/${id}`);
        })
      }
      disabled={isPending}
    >
      {isPending ? "Création…" : "+ Nouvelle séance"}
    </Button>
  );
}
