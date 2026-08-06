"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TauxHistorique {
  id: string;
  montant: string;
  dateEffet: Date;
  motif: string | null;
  definiLe: Date;
}

interface ModaleHistoriqueProps {
  ouvert: boolean;
  onClose: () => void;
  competenceLibelle: string;
  historique: TauxHistorique[];
}

export function ModaleHistorique({
  ouvert,
  onClose,
  competenceLibelle,
  historique,
}: ModaleHistoriqueProps) {
  // Tri par date d'effet décroissante
  const versions = [...historique].sort(
    (a, b) => b.dateEffet.getTime() - a.dateEffet.getTime()
  );

  // Taux en vigueur = premier dont dateEffet <= aujourd'hui
  const maintenant = new Date();
  const tauxEnVigueur = versions.find((t) => t.dateEffet <= maintenant);

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historique des taux — {competenceLibelle}</DialogTitle>
          <DialogDescription>
            Toutes les versions du taux journalier, de la plus récente à la
            plus ancienne
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Fil vertical */}
          <div className="relative">
            {/* Ligne verticale */}
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

            {/* Versions */}
            <div className="space-y-6">
              {versions.map((taux, index) => {
                const estEnVigueur = tauxEnVigueur?.id === taux.id;
                const montant = parseFloat(taux.montant);

                // Calculer variation avec la version suivante
                let variation: number | null = null;
                if (index < versions.length - 1) {
                  const montantPrecedent = parseFloat(
                    versions[index + 1].montant
                  );
                  variation =
                    ((montant - montantPrecedent) / montantPrecedent) * 100;
                }

                // Période de validité
                const dateDebut = taux.dateEffet;
                const dateFin =
                  index > 0 ? versions[index - 1].dateEffet : null;

                return (
                  <div key={taux.id} className="relative pl-10">
                    {/* Point */}
                    <div
                      className={`absolute left-0 top-1 size-6 rounded-full border-2 flex items-center justify-center ${
                        estEnVigueur
                          ? "bg-primary border-primary"
                          : "bg-background border-border"
                      }`}
                    >
                      {estEnVigueur && (
                        <CheckCircle2 className="size-3.5 text-white" />
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-lg font-semibold text-foreground">
                            {montant.toLocaleString("fr-FR")} F
                          </p>
                          <p className="text-xs text-muted-foreground">
                            par jour
                          </p>
                        </div>
                        {estEnVigueur && (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="size-3" />
                            En vigueur
                          </Badge>
                        )}
                      </div>

                      {/* Période */}
                      <p className="text-sm text-muted-foreground mb-2">
                        Depuis le{" "}
                        {format(dateDebut, "d MMMM yyyy", { locale: fr })}
                        {dateFin &&
                          ` jusqu'au ${format(dateFin, "d MMMM yyyy", { locale: fr })}`}
                      </p>

                      {/* Motif */}
                      {taux.motif && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Motif
                          </p>
                          <p className="text-sm text-foreground">
                            {taux.motif}
                          </p>
                        </div>
                      )}

                      {/* Variation */}
                      {variation !== null && (
                        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            Variation suivante :
                          </p>
                          <div
                            className={`flex items-center gap-1 text-sm font-medium ${
                              variation > 0
                                ? "text-green-600"
                                : variation < 0
                                  ? "text-red-600"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {variation > 0 ? (
                              <TrendingUp className="size-3.5" />
                            ) : variation < 0 ? (
                              <TrendingDown className="size-3.5" />
                            ) : null}
                            {variation > 0 ? "+" : ""}
                            {variation.toFixed(1)} %
                          </div>
                        </div>
                      )}

                      {/* Métadonnées */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Défini le{" "}
                          {format(taux.definiLe, "d MMMM yyyy à HH:mm", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rappel */}
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              <strong>Rappel :</strong> Une paie du mois de mars applique le
              taux en vigueur en mars, quel que soit le taux d'aujourd'hui.
              C'est ce qui rend une paie passée justifiable.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
