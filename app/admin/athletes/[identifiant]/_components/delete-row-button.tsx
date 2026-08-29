"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePerformance, deleteCompetition } from "../actions";
import { Button } from "@/components/ui/button";

type Props =
  | { kind: "performance"; athleteId: string; id: string; confirmMessage: string }
  | { kind: "competition"; athleteId: string; id: string; confirmMessage: string };

export function DeleteRowButton(props: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(props.confirmMessage)) return;
    startTransition(async () => {
      const result =
        props.kind === "performance"
          ? await deletePerformance(props.id, props.athleteId)
          : await deleteCompetition(props.id, props.athleteId);
      if (result.error) window.alert(result.error);
    });
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="icon-sm"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Supprimer"
    >
      <Trash2 />
    </Button>
  );
}
