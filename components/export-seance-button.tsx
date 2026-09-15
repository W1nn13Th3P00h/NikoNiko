"use client";

import { Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ExportSeanceButtonProps {
  exportUrl: string;
  exportable: boolean;
}

// Shared between /mon-plan/seances/[seanceId] and the admin seance editor —
// same route contract on both sides (see specs/002-export-seance-fit/contracts).
export function ExportSeanceButton({ exportUrl, exportable }: ExportSeanceButtonProps) {
  if (!exportable) return null;

  return (
    <div className="flex items-center gap-1">
      <Button render={<a href={exportUrl} download />} variant="outline" size="sm">
        <Download />
        Exporter
      </Button>
      <Dialog>
        <DialogTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Comment utiliser ce fichier sur ma montre ?" />
          }
        >
          <Info />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Utiliser ce fichier sur ta montre</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Apple Watch</strong> — l&apos;app Watch n&apos;importe pas ce
              fichier directement : passe par une app tierce sur ton iPhone (par ex. WatchFit ou Watchletic),
              qui l&apos;envoie ensuite à ta montre.
            </p>
            <p>
              <strong className="text-foreground">Suunto</strong> — l&apos;app Suunto n&apos;importe pas non plus
              ce fichier directement : passe par un service pont (par ex. intervals.icu), qui l&apos;importe
              puis le synchronise vers ton compte Suunto.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
