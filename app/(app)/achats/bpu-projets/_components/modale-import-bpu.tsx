"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Upload, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { importerBPU } from "@/lib/actions/bpu";
import { parserBPUExcel } from "@/lib/bpu/parse-excel";
import { prisma } from "@/lib/db/prisma";

interface ModaleImportBPUProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModaleImportBPU({ open, onOpenChange }: ModaleImportBPUProps) {
  const [fichier, setFichier] = useState<File | null>(null);
  const [projetId, setProjetId] = useState("");
  const [projets, setProjets] = useState<Array<{ id: string; code: string; nom: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      chargerProjets();
    }
  }, [open]);

  async function chargerProjets() {
    try {
      const response = await fetch("/api/projets");
      const data = await response.json();
      setProjets(data);
    } catch (error) {
      console.error("Erreur chargement projets:", error);
    }
  }

  const handleFichierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error("Veuillez sélectionner un fichier Excel (.xlsx ou .xls)");
        return;
      }
      setFichier(file);
    }
  };

  const handleImport = async () => {
    if (!fichier) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    if (!projetId) {
      toast.error("Veuillez sélectionner un projet");
      return;
    }

    setLoading(true);

    try {
      // Lire le fichier
      const buffer = await fichier.arrayBuffer();

      // Parser le BPU
      const bpuParsed = parserBPUExcel(buffer);

      // Importer en base
      await importerBPU(projetId, {
        ...bpuParsed,
        fichierSource: fichier.name,
      }) as unknown;

      toast.success("BPU importé avec succès");
      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      console.error("Erreur import BPU:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'import"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer un BPU depuis Excel</DialogTitle>
          <DialogDescription>
            Sélectionnez un fichier Excel contenant le bordereau de prix unitaires
            et le projet auquel il est rattaché.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sélection du projet */}
          <div className="space-y-2">
            <Label htmlFor="projet">
              Projet <span className="text-destructive">*</span>
            </Label>
            <Combobox
              options={projets.map((p) => ({
                value: p.id,
                label: `${p.code} - ${p.nom}`,
              }))}
              value={projetId}
              onChange={setProjetId}
              placeholder="Sélectionner un projet"
              searchPlaceholder="Rechercher..."
              emptyText="Aucun projet trouvé."
            />
            <p className="text-xs text-muted-foreground">
              Le BPU sera rattaché à ce projet
            </p>
          </div>

          {/* Sélection du fichier */}
          <div className="space-y-2">
            <Label htmlFor="fichier">
              Fichier Excel <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="fichier"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFichierChange}
                className="hidden"
              />
              <label
                htmlFor="fichier"
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">
                    {fichier ? fichier.name : "Sélectionner un fichier..."}
                  </span>
                </div>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Format attendu : fichier Excel avec structure LOT → Série → Articles
            </p>
          </div>

          {/* Bouton d'import */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading || !fichier || !projetId}
              className="bg-[#1d186c] hover:bg-[#1d186c]/90"
            >
              {loading ? (
                "Import en cours..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
