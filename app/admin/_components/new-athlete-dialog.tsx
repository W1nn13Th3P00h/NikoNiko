"use client";

import { useState, useTransition } from "react";
import { slugify } from "@/lib/slugify";
import { createAthlete } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NewAthleteDialog() {
  const [open, setOpen] = useState(false);
  const [prenom, setPrenom] = useState("");
  const [identifiant, setIdentifiant] = useState("");
  const [identifiantTouched, setIdentifiantTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePrenomChange(value: string) {
    setPrenom(value);
    if (!identifiantTouched) setIdentifiant(slugify(value));
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createAthlete(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>+ Nouvel athlète</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel athlète</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                name="prenom"
                required
                value={prenom}
                onChange={(e) => handlePrenomChange(e.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" name="nom" required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="identifiant">Identifiant (slug d&apos;URL, connexion par code)</Label>
            <Input
              id="identifiant"
              name="identifiant"
              required
              value={identifiant}
              onChange={(e) => {
                setIdentifiant(e.target.value);
                setIdentifiantTouched(true);
              }}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="date_naissance">Date de naissance (optionnel)</Label>
              <Input id="date_naissance" name="date_naissance" type="date" />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="fc_max">FC max (optionnel)</Label>
              <Input id="fc_max" name="fc_max" type="number" />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="fc_repos">FC repos (optionnel)</Label>
              <Input id="fc_repos" name="fc_repos" type="number" />
            </div>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Création…" : "Créer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
