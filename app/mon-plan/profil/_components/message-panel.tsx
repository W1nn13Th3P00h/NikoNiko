"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { sendMessageToAdmin } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MessageRow {
  id: string;
  expediteur: string;
  contenu: string;
  created_at: string;
}

export function MessagePanel({ messages }: { messages: MessageRow[] }) {
  const [contenu, setContenu] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await sendMessageToAdmin(contenu);
      if (result.error) {
        setError(result.error);
      } else {
        setContenu("");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Écrire au coach</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          placeholder="Votre message…"
          rows={3}
        />
        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={isPending || !contenu.trim()} className="self-start">
            {isPending ? "Envoi…" : "Envoyer"}
          </Button>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        {messages.length > 0 && (
          <div className="mt-2 flex flex-col gap-2 border-t pt-3">
            {messages.map((m) => (
              <div key={m.id} className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-xs">
                  {m.expediteur === "coach" ? "Coach" : "Vous"} ·{" "}
                  {format(new Date(m.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                </p>
                <p className="text-sm">{m.contenu}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
