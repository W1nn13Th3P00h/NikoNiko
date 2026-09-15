"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { duplicateLibrarySeance } from "../actions";
import { Button } from "@/components/ui/button";

export function DuplicateSeanceButton({ seanceId, titre }: { seanceId: string; titre: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    // The card itself is a Link to the editor — stop the click from
    // navigating there.
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      try {
        const newId = await duplicateLibrarySeance(seanceId);
        if (newId) router.push(`/admin/bibliotheque/${newId}`);
      } catch {
        window.alert("Échec de la duplication, réessaie.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={handleClick}
      disabled={isPending}
      aria-label={`Dupliquer ${titre}`}
    >
      <Copy />
    </Button>
  );
}
