"use client";

import { useState } from "react";
import { Upload, Eye, Download, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ModaleImportBPU } from "./modale-import-bpu";
import { ModaleAffichageBPU } from "./modale-affichage-bpu";
import { supprimerBPU } from "@/lib/actions/bpu";
import { toast } from "sonner";

interface BPU {
  id: string;
  nom: string;
  description: string | null;
  dateImport: string;
  fichierSource: string | null;
  projet: {
    id: string;
    code: string;
    nom: string;
  };
  _count: {
    lots: number;
  };
}

interface ListeBPUProps {
  bpus: BPU[];
}

export function ListeBPU({ bpus }: ListeBPUProps) {
  const [modaleImport, setModaleImport] = useState(false);
  const [modaleAffichage, setModaleAffichage] = useState(false);
  const [bpuSelectionne, setBpuSelectionne] = useState<string | null>(null);

  const handleSuppression = async (bpuId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce BPU ?")) return;

    try {
      await supprimerBPU(bpuId) as unknown;
      toast.success("BPU supprimé");
      window.location.reload();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleVoir = (bpuId: string) => {
    setBpuSelectionne(bpuId);
    setModaleAffichage(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Bouton d'import */}
        <div className="flex justify-end">
          <Button
            onClick={() => setModaleImport(true)}
            className="rounded-full bg-[#1d186c] hover:bg-[#1d186c]/90 text-white"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importer un BPU Excel
          </Button>
        </div>

        {/* Liste des BPU */}
        {bpus.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">
              Aucun BPU importé
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Importez un fichier Excel contenant un bordereau de prix unitaires
            </p>
            <Button
              onClick={() => setModaleImport(true)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Importer le premier BPU
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {bpus.map((bpu) => (
              <div
                key={bpu.id}
                className="rounded-xl border border-[#0000001a] bg-white p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[#1D186C]">
                        {bpu.nom}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {bpu._count.lots} lot{bpu._count.lots > 1 ? "s" : ""}
                      </Badge>
                    </div>

                    {bpu.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {bpu.description}
                      </p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Projet :</span>{" "}
                        {bpu.projet.code} - {bpu.projet.nom}
                      </div>
                      <div>
                        <span className="font-medium">Importé le :</span>{" "}
                        {format(new Date(bpu.dateImport), "dd/MM/yyyy · HH:mm", {
                          locale: fr,
                        })}
                      </div>
                      {bpu.fichierSource && (
                        <div>
                          <span className="font-medium">Fichier :</span>{" "}
                          {bpu.fichierSource}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVoir(bpu.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSuppression(bpu.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      <ModaleImportBPU
        open={modaleImport}
        onOpenChange={setModaleImport}
      />

      {bpuSelectionne && (
        <ModaleAffichageBPU
          open={modaleAffichage}
          onOpenChange={setModaleAffichage}
          bpuId={bpuSelectionne}
        />
      )}
    </>
  );
}
