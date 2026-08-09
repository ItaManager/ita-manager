"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2 } from "lucide-react";
import type { CompetenceListItem } from "@/lib/actions/competences";
import { historiqueTaux } from "@/lib/actions/competences";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ModalHistoriqueTauxProps {
  ouvert: boolean;
  onClose: () => void;
  competence: CompetenceListItem;
}

interface VersionTaux {
  id: string;
  montant: string;
  dateEffet: Date;
  motif: string | null;
  definiLe: Date;
  estEnVigueur: boolean;
  variation: number | null;
}

export function ModalHistoriqueTaux({
  ouvert,
  onClose,
  competence,
}: ModalHistoriqueTauxProps) {
  const [versions, setVersions] = useState<VersionTaux[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (ouvert) {
      setIsLoading(true);
      historiqueTaux(competence.id)
        .then((result) => {
          if (result.success && result.data && !Array.isArray(result.data)) {
            setVersions(result.data.taux);
          } else {
            setVersions([]);
          }
        })
        .catch(() => {
          setVersions([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [ouvert, competence.id]);

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader
          className="border-b border-border px-6 py-4"
          style={{ backgroundColor: "var(--primary-soft)" }}
        >
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            Historique des taux
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {competence.libelle}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          {/* Timeline des versions */}
          <div className="space-y-4 relative max-h-[60vh] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun taux historique pour cette compétence.
              </p>
            ) : (
              <>
                {versions.map((version, index) => (
                  <div key={version.id} className="flex gap-4">
                    {/* Indicateur */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`size-3 rounded-full ${
                          version.estEnVigueur ? "bg-[#13850b]" : "bg-gray-400"
                        }`}
                      />
                      {index < versions.length - 1 && (
                        <div className="w-0.5 h-full bg-border mt-2" />
                      )}
                    </div>

                    {/* Carte version */}
                    <div
                      className={`flex-1 rounded-lg border-2 p-4 ${
                        version.estEnVigueur
                          ? "border-[#13850b] bg-green-50"
                          : "border-border bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-baseline gap-2">
                          <div className="text-2xl font-bold text-[#1D186C]">
                            {parseFloat(version.montant).toLocaleString("fr-FR")} F
                          </div>
                          {version.variation !== null && (
                            <span
                              className={`text-sm font-medium ${
                                version.variation > 0
                                  ? "text-green-600"
                                  : version.variation < 0
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {version.variation > 0 ? "+" : ""}
                              {version.variation.toFixed(1)} %
                            </span>
                          )}
                        </div>
                        <Badge
                          variant={version.estEnVigueur ? "default" : "secondary"}
                          className={
                            version.estEnVigueur
                              ? "bg-[#13850b] hover:bg-[#13850b]"
                              : ""
                          }
                        >
                          {version.estEnVigueur ? "en vigueur" : "remplacé"}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Depuis le{" "}
                        {format(new Date(version.dateEffet), "dd/MM/yyyy", {
                          locale: fr,
                        })}
                      </p>

                      {version.motif && (
                        <p className="text-sm text-orange-700 mt-2">
                          {version.motif}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Message informatif */}
          {versions.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <AlertCircle className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Une paie du mois de mars applique le taux en vigueur en mars,
                quel que soit le taux d'aujourd'hui.{" "}
                <strong>C'est ce qui rend une paie passée justifiable.</strong>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {versions.length} version{versions.length > 1 ? "s" : ""}
          </span>
          <Button
            onClick={onClose}
            className="bg-[#1D186C] hover:bg-[#171356] text-white rounded-full px-6"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
