"use client";

import { useState, useTransition } from "react";
import { exporterJournal } from "@/lib/actions/administration";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

type Props = {
  filtres: {
    dateDebut?: string;
    dateFin?: string;
    auteurId?: string;
    entite?: string;
    action?: string;
  };
};

export function BoutonExportJournal({ filtres }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      const { csv, nomFichier } = await exporterJournal(filtres);

      // Télécharger le fichier CSV
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nomFichier;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <Button onClick={handleExport} disabled={isPending} className="rounded-full">
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      Exporter CSV
    </Button>
  );
}
