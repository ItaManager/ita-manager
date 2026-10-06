"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { obtenirBPU } from "@/lib/actions/bpu";
import { telechargerBPU } from "@/lib/bpu/export-excel";

interface Ligne {
  id: string;
  numero: string;
  type: string | null;
  description: string;
  unite: string;
  prixUnitaireHT: number;
}

interface Serie {
  id: string;
  code: string;
  titre: string;
  sousTitre: string | null;
  lignes: Ligne[];
}

interface Lot {
  id: string;
  numero: string;
  titre: string;
  categorie: string | null;
  series: Serie[];
}

interface BPU {
  id: string;
  nom: string;
  description: string | null;
  projet: {
    code: string;
    nom: string;
  };
  lots: Lot[];
}

interface ModaleAffichageBPUProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bpuId: string;
}

export function ModaleAffichageBPU({
  open,
  onOpenChange,
  bpuId,
}: ModaleAffichageBPUProps) {
  const [bpu, setBpu] = useState<BPU | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && bpuId) {
      chargerBPU();
    }
  }, [open, bpuId]);

  async function chargerBPU() {
    setLoading(true);
    try {
      const data = await obtenirBPU(bpuId) as unknown;
      setBpu(data as BPU);
    } catch (error) {
      console.error("Erreur chargement BPU:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleExport = () => {
    if (!bpu) return;

    telechargerBPU({
      nom: bpu.nom,
      lots: bpu.lots.map((lot) => ({
        numero: lot.numero,
        titre: lot.titre,
        categorie: lot.categorie,
        series: lot.series.map((serie) => ({
          code: serie.code,
          titre: serie.titre,
          sousTitre: serie.sousTitre,
          lignes: serie.lignes.map((ligne) => ({
            numero: ligne.numero,
            type: ligne.type,
            description: ligne.description,
            unite: ligne.unite,
            prixUnitaireHT: Number(ligne.prixUnitaireHT),
          })),
        })),
      })),
      projet: bpu.projet,
    }, `BPU_${bpu.projet.code}.xlsx`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{bpu?.nom}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Projet : {bpu?.projet.code} - {bpu?.projet.nom}
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleExport}
              className="rounded-full bg-[#1d186c] hover:bg-[#1d186c]/90"
              disabled={!bpu}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter Excel
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        ) : bpu ? (
          <div className="space-y-6 py-4">
            {bpu.lots.map((lot) => (
              <div key={lot.id} className="space-y-4">
                {/* Titre du lot */}
                <div className="rounded-lg bg-muted/50 px-4 py-3 border">
                  <h3 className="text-lg font-semibold">
                    {lot.numero} - {lot.titre}
                  </h3>
                  {lot.categorie && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {lot.categorie}
                    </p>
                  )}
                </div>

                {/* Séries du lot */}
                {lot.series.map((serie) => (
                  <div key={serie.id} className="ml-4 space-y-3">
                    {/* Titre de la série */}
                    <div className="rounded-lg bg-orange-100 px-4 py-2">
                      <h4 className="font-semibold text-sm">
                        {serie.code} - {serie.titre}
                      </h4>
                      {serie.sousTitre && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {serie.sousTitre}
                        </p>
                      )}
                    </div>

                    {/* Tableau des lignes */}
                    <div className="ml-4 rounded-lg border overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr className="border-b">
                            <th className="px-3 py-2 text-left text-xs font-semibold">
                              N°
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold">
                              Type
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold">
                              Description
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold">
                              Unité
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-semibold">
                              Prix U €HT
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {serie.lignes.map((ligne) => (
                            <tr key={ligne.id} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="px-3 py-2 text-xs whitespace-nowrap">
                                {ligne.numero}
                              </td>
                              <td className="px-3 py-2 text-xs whitespace-nowrap">
                                {ligne.type || "—"}
                              </td>
                              <td className="px-3 py-2 text-xs">
                                {ligne.description}
                              </td>
                              <td className="px-3 py-2 text-xs whitespace-nowrap text-center">
                                {ligne.unite}
                              </td>
                              <td className="px-3 py-2 text-xs whitespace-nowrap text-right tabular-nums font-medium">
                                {Number(ligne.prixUnitaireHT).toLocaleString("fr-FR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })} €
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Impossible de charger le BPU
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
