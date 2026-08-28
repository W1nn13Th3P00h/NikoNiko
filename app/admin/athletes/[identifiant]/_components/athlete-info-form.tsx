"use client";

import { useState, useTransition } from "react";
import { updateAthleteInfos } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function AthleteInfoForm({
  athleteId,
  initial,
}: {
  athleteId: string;
  initial: {
    prenom: string;
    nom: string;
    email: string;
    dateNaissance: string | null;
    fcMax: number | null;
    fcRepos: number | null;
    actif: boolean;
  };
}) {
  const [prenom, setPrenom] = useState(initial.prenom);
  const [nom, setNom] = useState(initial.nom);
  const [email, setEmail] = useState(initial.email);
  const [dateNaissance, setDateNaissance] = useState(initial.dateNaissance ?? "");
  const [fcMax, setFcMax] = useState(initial.fcMax?.toString() ?? "");
  const [fcRepos, setFcRepos] = useState(initial.fcRepos?.toString() ?? "");
  const [actif, setActif] = useState(initial.actif);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  function handleSubmit() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateAthleteInfos(athleteId, {
        prenom,
        nom,
        email,
        dateNaissance: dateNaissance || null,
        fcMax: fcMax ? Number(fcMax) : null,
        fcRepos: fcRepos ? Number(fcRepos) : null,
        actif,
      });
      setMessage(
        result.error
          ? { type: "error", text: result.error }
          : { type: "success", text: "Infos enregistrées." }
      );
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="prenom">Prénom</Label>
          <Input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nom">Nom</Label>
          <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date_naissance">Date de naissance</Label>
          <Input
            id="date_naissance"
            type="date"
            value={dateNaissance}
            onChange={(e) => setDateNaissance(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fc_max">FC max</Label>
          <Input id="fc_max" type="number" value={fcMax} onChange={(e) => setFcMax(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fc_repos">FC repos</Label>
          <Input id="fc_repos" type="number" value={fcRepos} onChange={(e) => setFcRepos(e.target.value)} />
        </div>
        <div className="flex flex-col justify-end gap-1.5 pb-1.5">
          <div className="flex items-center gap-2">
            <Checkbox id="actif" checked={actif} onCheckedChange={(c) => setActif(c === true)} />
            <Label htmlFor="actif">Actif</Label>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={isPending} className="self-start">
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {message && (
          <p className={message.type === "error" ? "text-destructive text-sm" : "text-sm"}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
