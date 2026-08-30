"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteSeance } from "@/app/admin/_lib/seance-actions";
import { Button } from "@/components/ui/button";

export function DeleteSeanceButton({ seanceId, titre }: { seanceId: string; titre: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    // The card itself is a Link to the editor — stop the click from
    // navigating there before the confirm dialog even opens.
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Supprimer « ${titre} » de la bibliothèque ?`)) return;
    startTransition(async () => {
      const { error } = await deleteSeance(seanceId);
      if (error) {
        window.alert(`Échec de la suppression : ${error}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="icon-sm"
      onClick={handleClick}
      disabled={isPending}
      aria-label={`Supprimer ${titre}`}
    >
      <Trash2 />
    </Button>
  );
}
