"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { computeSeanceVolume } from "@/lib/volume";
import {
  formatPaceSecondsPerKm,
  getAthletePaceZone,
  ZONE_LABELS,
  type PerformanceReference,
  type ZoneAllure,
} from "@/lib/paces";
import {
  BLOC_ROLE_LABELS,
  CIBLE_TYPE_LABELS,
  MODE_DUREE_LABELS,
  SEANCE_TYPE_LABELS,
} from "@/lib/labels";
import type { Database } from "@/lib/database.types";
import {
  type DraftBloc,
  type BlocRole,
  type ModeDuree,
  type CibleType,
  applyCibleTypeDefaults,
  applyModeDureeDefaults,
  blankBloc,
  draftToBlocSeanceInput,
} from "../_lib/draft";
import { saveSeance } from "../_lib/seance-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SeanceType = Database["public"]["Enums"]["seance_type"];
type SeanceRow = Database["public"]["Tables"]["seance"]["Row"];

const ZONE_OPTIONS: ZoneAllure[] = [
  "z1_recup",
  "z2_endurance",
  "z3_marathon",
  "z4_seuil",
  "z5_vma",
  "z6_anaerobie",
];

function realPacePreview(bloc: DraftBloc, performances: PerformanceReference[]): string {
  if (bloc.cibleType === "libre") return "Libre";
  if (bloc.cibleType === "rpe") return `RPE ${bloc.cibleRpe ?? "—"}`;
  if (bloc.cibleType === "allure_absolue") {
    return bloc.cibleAllureSecondesParKm ? formatPaceSecondsPerKm(bloc.cibleAllureSecondesParKm) : "—";
  }
  // zone_allure / zone_fc
  if (!bloc.cibleZone) return "—";
  const result = getAthletePaceZone(bloc.cibleZone, performances);
  if (!result.available) return `${ZONE_LABELS[bloc.cibleZone]} (pas de référence)`;
  const { minSecondsPerKm, maxSecondsPerKm } = result.range;
  return minSecondsPerKm === null
    ? `< ${formatPaceSecondsPerKm(maxSecondsPerKm)}`
    : `${formatPaceSecondsPerKm(minSecondsPerKm)} – ${formatPaceSecondsPerKm(maxSecondsPerKm)}`;
}

export function SeanceEditor({
  athlete,
  seance,
  initialBlocs,
  performances,
  redirectPath,
  allowSaveAsLibraryCopy,
}: {
  // Null when editing a library template directly (no athlete context, so
  // no real pace to preview against — realPacePreview falls back to
  // showing the zone name with a "pas de référence" hint).
  athlete: { id: string; prenom: string; nom: string } | null;
  seance: SeanceRow;
  initialBlocs: DraftBloc[];
  performances: PerformanceReference[];
  redirectPath: string;
  allowSaveAsLibraryCopy: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [titre, setTitre] = useState(seance.titre);
  const [type, setType] = useState<SeanceType>(seance.type);
  const [objectif, setObjectif] = useState(seance.objectif ?? "");
  const [consignes, setConsignes] = useState(seance.consignes ?? "");
  const [blocs, setBlocs] = useState<DraftBloc[]>(initialBlocs);
  const [saveToLibrary, setSaveToLibrary] = useState(false);

  const topLevelBlocs = blocs.filter((b) => b.parentClientId === null);
  const childrenOf = (parentClientId: string) =>
    blocs.filter((b) => b.parentClientId === parentClientId);

  const volume = computeSeanceVolume(blocs.map(draftToBlocSeanceInput), performances);

  function updateBloc(clientId: string, patch: Partial<DraftBloc>) {
    setBlocs((prev) => prev.map((b) => (b.clientId === clientId ? { ...b, ...patch } : b)));
  }

  function addTopLevelBloc() {
    setBlocs((prev) => [...prev, blankBloc(null)]);
  }

  function addChildBloc(parentClientId: string) {
    setBlocs((prev) => [...prev, blankBloc(parentClientId)]);
  }

  function removeBloc(clientId: string) {
    setBlocs((prev) => prev.filter((b) => b.clientId !== clientId && b.parentClientId !== clientId));
  }

  function duplicateBloc(clientId: string) {
    setBlocs((prev) => {
      const bloc = prev.find((b) => b.clientId === clientId);
      if (!bloc) return prev;
      const children = prev.filter((b) => b.parentClientId === clientId);
      const newId = crypto.randomUUID();
      const clonedParent: DraftBloc = { ...bloc, clientId: newId };
      const clonedChildren = children.map((c) => ({
        ...c,
        clientId: crypto.randomUUID(),
        parentClientId: newId,
      }));

      const indices = [prev.findIndex((b) => b.clientId === clientId), ...children.map((c) => prev.findIndex((b) => b.clientId === c.clientId))];
      const insertAt = Math.max(...indices) + 1;
      const next = [...prev];
      next.splice(insertAt, 0, clonedParent, ...clonedChildren);
      return next;
    });
  }

  function moveBloc(clientId: string, direction: -1 | 1) {
    setBlocs((prev) => {
      const bloc = prev.find((b) => b.clientId === clientId);
      if (!bloc) return prev;
      const siblings = prev.filter((b) => b.parentClientId === bloc.parentClientId);
      const siblingIndex = siblings.findIndex((b) => b.clientId === clientId);
      const target = siblings[siblingIndex + direction];
      if (!target) return prev;

      const i = prev.findIndex((b) => b.clientId === clientId);
      const j = prev.findIndex((b) => b.clientId === target.clientId);
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      await saveSeance(
        seance.id,
        {
          titre,
          type,
          objectif: objectif.trim() || null,
          consignes: consignes.trim() || null,
        },
        blocs,
        { saveAsLibraryCopy: allowSaveAsLibraryCopy && saveToLibrary }
      );
      router.push(redirectPath);
    });
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <h1 className="text-2xl font-semibold">Édition de séance</h1>
        <p className="text-muted-foreground text-sm">
          {athlete ? `${athlete.prenom} ${athlete.nom}` : "Bibliothèque"}
          {seance.date_prevue ? ` — ${seance.date_prevue}` : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Séance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="titre">Titre</Label>
            <Input id="titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => v && setType(v as SeanceType)} items={SEANCE_TYPE_LABELS}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEANCE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="objectif">Objectif (une phrase, affichée à l&apos;athlète)</Label>
            <Textarea id="objectif" rows={2} value={objectif} onChange={(e) => setObjectif(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="consignes">Consignes (optionnel)</Label>
            <Textarea id="consignes" rows={3} value={consignes} onChange={(e) => setConsignes(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aperçu — volume total</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">
            {volume.distanceKm} km · {volume.dureeMinutes} min
          </p>
          {!volume.estimationComplete && (
            <p className="text-muted-foreground text-sm">
              Estimation partielle : l&apos;athlète n&apos;a pas de performance de référence pour
              convertir certaines zones en distance.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blocs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {topLevelBlocs.map((bloc, index) => (
            <div key={bloc.clientId} className="flex flex-col gap-2 rounded-md border p-3">
              <BlocRowEditor
                bloc={bloc}
                performances={performances}
                onChange={(patch) => updateBloc(bloc.clientId, patch)}
                onRemove={() => removeBloc(bloc.clientId)}
                onDuplicate={() => duplicateBloc(bloc.clientId)}
                onMoveUp={index > 0 ? () => moveBloc(bloc.clientId, -1) : undefined}
                onMoveDown={index < topLevelBlocs.length - 1 ? () => moveBloc(bloc.clientId, 1) : undefined}
              />

              <div className="ml-6 flex flex-col gap-2 border-l pl-3">
                {childrenOf(bloc.clientId).map((child, childIndex, arr) => (
                  <BlocRowEditor
                    key={child.clientId}
                    bloc={child}
                    performances={performances}
                    onChange={(patch) => updateBloc(child.clientId, patch)}
                    onRemove={() => removeBloc(child.clientId)}
                    onDuplicate={() => duplicateBloc(child.clientId)}
                    onMoveUp={childIndex > 0 ? () => moveBloc(child.clientId, -1) : undefined}
                    onMoveDown={childIndex < arr.length - 1 ? () => moveBloc(child.clientId, 1) : undefined}
                  />
                ))}
                <Button variant="ghost" size="sm" onClick={() => addChildBloc(bloc.clientId)} className="self-start">
                  + Sous-bloc
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addTopLevelBloc} className="self-start">
            + Ajouter un bloc
          </Button>
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 flex items-center justify-between border-t bg-background px-6 py-3">
        <div className="flex items-center gap-2">
          {allowSaveAsLibraryCopy && (
            <>
              <Checkbox
                id="save-to-library"
                checked={saveToLibrary}
                onCheckedChange={(c) => setSaveToLibrary(c === true)}
              />
              <Label htmlFor="save-to-library">Enregistrer aussi dans la bibliothèque</Label>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(redirectPath)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BlocRowEditor({
  bloc,
  performances,
  onChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: {
  bloc: DraftBloc;
  performances: PerformanceReference[];
  onChange: (patch: Partial<DraftBloc>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded border bg-muted/30 p-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Rôle</Label>
          <Select value={bloc.role} onValueChange={(v) => v && onChange({ role: v as BlocRole })} items={BLOC_ROLE_LABELS}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BLOC_ROLE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs">Répétitions</Label>
          <Input
            type="number"
            min={1}
            value={bloc.repetitions}
            onChange={(e) => onChange({ repetitions: Math.max(1, Number(e.target.value) || 1) })}
            className="w-20"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs">Mode</Label>
          <Select
            value={bloc.modeDuree}
            onValueChange={(v) => v && onChange(applyModeDureeDefaults(bloc, v as ModeDuree))}
            items={MODE_DUREE_LABELS}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MODE_DUREE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {bloc.modeDuree === "distance" && (
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Distance (m)</Label>
            <Input
              type="number"
              min={1}
              value={bloc.distanceMetres ?? ""}
              onChange={(e) => onChange({ distanceMetres: Number(e.target.value) || null })}
              className="w-24"
            />
          </div>
        )}

        {(bloc.modeDuree === "temps" || bloc.modeDuree === "libre") && (
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Durée (s)</Label>
            <Input
              type="number"
              min={0}
              value={bloc.dureeSecondes ?? ""}
              onChange={(e) => onChange({ dureeSecondes: Number(e.target.value) || null })}
              className="w-24"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <Label className="text-xs">Cible</Label>
          <Select
            value={bloc.cibleType}
            onValueChange={(v) => v && onChange(applyCibleTypeDefaults(bloc, v as CibleType))}
            items={CIBLE_TYPE_LABELS}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CIBLE_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(bloc.cibleType === "zone_allure" || bloc.cibleType === "zone_fc") && (
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Zone</Label>
            <Select
              value={bloc.cibleZone ?? "z2_endurance"}
              onValueChange={(v) => v && onChange({ cibleZone: v as ZoneAllure })}
              items={ZONE_LABELS}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ZONE_OPTIONS.map((z) => (
                  <SelectItem key={z} value={z}>
                    {ZONE_LABELS[z]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {bloc.cibleType === "allure_absolue" && (
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Allure (s/km)</Label>
            <Input
              type="number"
              min={1}
              value={bloc.cibleAllureSecondesParKm ?? ""}
              onChange={(e) => onChange({ cibleAllureSecondesParKm: Number(e.target.value) || null })}
              className="w-24"
            />
          </div>
        )}

        {bloc.cibleType === "rpe" && (
          <div className="flex flex-col gap-1">
            <Label className="text-xs">RPE (1-10)</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={bloc.cibleRpe ?? ""}
              onChange={(e) => onChange({ cibleRpe: Number(e.target.value) || null })}
              className="w-20"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <Label className="text-xs">Commentaire</Label>
          <Input
            value={bloc.commentaire ?? ""}
            onChange={(e) => onChange({ commentaire: e.target.value || null })}
            className="w-40"
          />
        </div>

        <div className="ml-auto flex gap-1">
          {onMoveUp && (
            <Button variant="ghost" size="sm" onClick={onMoveUp} aria-label="Monter">
              ↑
            </Button>
          )}
          {onMoveDown && (
            <Button variant="ghost" size="sm" onClick={onMoveDown} aria-label="Descendre">
              ↓
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onDuplicate}>
            Dupliquer
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Supprimer
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        Allure réelle de l&apos;athlète : {realPacePreview(bloc, performances)}
      </p>
    </div>
  );
}
