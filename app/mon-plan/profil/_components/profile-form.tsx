"use client";

import { useState, useTransition } from "react";
import { updateOwnProfile, changeOwnPassword } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileForm({
  initial,
}: {
  initial: { prenom: string; nom: string; dateNaissance: string | null };
}) {
  const [prenom, setPrenom] = useState(initial.prenom);
  const [nom, setNom] = useState(initial.nom);
  const [dateNaissance, setDateNaissance] = useState(initial.dateNaissance ?? "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  function handleSubmit() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateOwnProfile({ prenom, nom, dateNaissance: dateNaissance || null });
      setMessage(
        result.error
          ? { type: "error", text: result.error }
          : { type: "success", text: "Infos enregistrées." }
      );
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mes infos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="prenom">Prénom</Label>
          <Input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nom">Nom</Label>
          <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
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
      </CardContent>
    </Card>
  );
}

export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  function handleSubmit() {
    setMessage(null);
    if (password !== confirm) {
      setMessage({ type: "error", text: "Les deux mots de passe ne correspondent pas." });
      return;
    }
    startTransition(async () => {
      const result = await changeOwnPassword(password);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Mot de passe modifié." });
        setPassword("");
        setConfirm("");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Changer de mot de passe</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">Confirmer</Label>
          <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={isPending || !password} className="self-start">
            {isPending ? "Enregistrement…" : "Modifier"}
          </Button>
          {message && (
            <p className={message.type === "error" ? "text-destructive text-sm" : "text-sm"}>
              {message.text}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
