"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setAthleteCredentials } from "../actions";

export function CredentialsForm({
  athleteId,
  currentIdentifiant,
}: {
  athleteId: string;
  currentIdentifiant: string | null;
}) {
  const [identifiant, setIdentifiant] = useState(currentIdentifiant ?? "");
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  function handleSubmit() {
    setMessage(null);
    startTransition(async () => {
      const result = await setAthleteCredentials(athleteId, identifiant, code);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Identifiant et code enregistrés." });
        setCode("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {currentIdentifiant && (
        <p className="text-muted-foreground text-sm">
          Identifiant actuel : <strong>{currentIdentifiant}</strong>
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="identifiant">Identifiant</Label>
        <Input
          id="identifiant"
          value={identifiant}
          onChange={(e) => setIdentifiant(e.target.value)}
          placeholder="ex: karim"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">
          {currentIdentifiant ? "Nouveau code" : "Code"} (6 caractères minimum)
        </Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ex: 482913"
        />
      </div>
      <Button onClick={handleSubmit} disabled={isPending || !identifiant || !code} className="self-start">
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
      {message && (
        <p className={message.type === "error" ? "text-destructive text-sm" : "text-sm"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
