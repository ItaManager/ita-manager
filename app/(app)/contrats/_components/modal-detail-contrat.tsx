"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Download, RefreshCw, FileText, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Contrat {
  id: string;
  employe: {
    id: string;
    nom: string;
    prenom: string;
    matricule: string;
    typeMainOeuvre: string;
  };
  typeContrat: string;
  dateDebut: Date;
  dateFin?: Date;
  salaire?: number;
  derniersAvenants: number;
  actif: boolean;
  niveauAlerte: "danger" | "warning" | null;
  documentUrl?: string;
}

interface ModalDetailContratProps {
  contrat: Contrat | null;
  ouvert: boolean;
  onFermer: () => void;
  onRenouveler?: (contrat: Contrat) => void;
}

export function ModalDetailContrat({
  contrat,
  ouvert,
  onFermer,
  onRenouveler,
}: ModalDetailContratProps) {
  if (!contrat) return null;

  const calculerJoursRestants = (dateFin?: Date): number | null => {
    if (!dateFin) return null;
    const now = new Date();
    const fin = new Date(dateFin);
    const diff = fin.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const joursRestants = calculerJoursRestants(contrat.dateFin);

  const getBadgeEcheance = (joursRestants: number | null) => {
    if (joursRestants === null) {
      return (
        <Badge variant="outline" className="bg-primary-soft text-primary border-primary/20">
          CDI (Indéterminé)
        </Badge>
      );
    }

    if (joursRestants < 0) {
      return (
        <Badge variant="destructive">
          EXPIRÉ (il y a {Math.abs(joursRestants)} jours)
        </Badge>
      );
    }

    if (joursRestants < 30) {
      return (
        <Badge variant="destructive" className="gap-1.5">
          CRITIQUE - {joursRestants} jours restants
        </Badge>
      );
    }

    if (joursRestants < 60) {
      return (
        <Badge className="gap-1.5 bg-warning-soft text-warning border-warning/20">
          ALERTE - {joursRestants} jours restants
        </Badge>
      );
    }

    return (
      <Badge className="gap-1.5 bg-success-soft text-success border-success/20">
        OK - {joursRestants} jours restants
      </Badge>
    );
  };

  const handleTelecharger = async () => {
    // TODO: Implémenter la génération et téléchargement du PDF
    console.log("Télécharger contrat", contrat.id);
  };

  return (
    <Dialog open={ouvert} onOpenChange={onFermer}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="relative -mt-6 -mx-6 px-6 pt-6 pb-4 rounded-t-xl" style={{ backgroundColor: '#ebeaf2' }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onFermer}
            className="absolute -right-2 -top-2 h-8 w-8"
          >
            <X className="size-4" />
          </Button>
          <DialogTitle className="text-xl font-semibold" style={{ color: '#1d186c' }}>
            Détail du contrat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Colonne gauche - Informations */}
            <div className="space-y-6">
              {/* Employé */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Employé</h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="font-medium text-base">
                    {contrat.employe.nom} {contrat.employe.prenom}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono mt-1">
                    {contrat.employe.matricule}
                  </div>
                </div>
              </div>

              {/* Informations du contrat */}
              <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Type de contrat</h3>
              <div>
                {contrat.typeContrat === "CDD" ? (
                  <Badge className="bg-warning-soft text-warning border-warning/20">CDD</Badge>
                ) : contrat.typeContrat === "CDI" ? (
                  <Badge className="border-[#13850b]/20" style={{ backgroundColor: '#e8f5e9', color: '#13850b' }}>CDI</Badge>
                ) : (
                  <Badge variant="outline">{contrat.typeContrat}</Badge>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Statut</h3>
              <div>
                {contrat.actif ? (
                  <Badge className="bg-success-soft text-success border-success/20">Actif</Badge>
                ) : (
                  <Badge className="bg-destructive-soft text-destructive border-destructive/20">Inactif</Badge>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Date de début</h3>
              <div className="text-base">
                {format(new Date(contrat.dateDebut), "dd MMMM yyyy", { locale: fr })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Date de fin</h3>
              <div className="text-base">
                {contrat.dateFin ? (
                  format(new Date(contrat.dateFin), "dd MMMM yyyy", { locale: fr })
                ) : (
                  <span className="text-muted-foreground">Indéterminée</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Salaire mensuel brut</h3>
              <div className="text-base font-medium">
                {contrat.salaire ? (
                  <>
                    {new Intl.NumberFormat('fr-FR').format(contrat.salaire)} FCFA
                  </>
                ) : (
                  <span className="text-muted-foreground">Non renseigné</span>
                )}
              </div>
            </div>
          </div>

          {/* Échéance */}
          {contrat.typeContrat === "CDD" && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Échéance</h3>
              <div>{getBadgeEcheance(joursRestants)}</div>
            </div>
          )}

              {/* Avenants */}
              {contrat.derniersAvenants > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Avenants</h3>
                  <div className="text-base">
                    {contrat.derniersAvenants} avenant{contrat.derniersAvenants > 1 ? "s" : ""} enregistré{contrat.derniersAvenants > 1 ? "s" : ""}
                  </div>
                </div>
              )}
            </div>

            {/* Colonne droite - Aperçu du document */}
            <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Document du contrat</h3>
            {contrat.documentUrl ? (
              <div className="border-2 border-border rounded-lg overflow-hidden bg-muted/20">
                <div className="bg-muted px-4 py-2 flex items-center justify-between border-b border-border">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    <span className="text-sm font-medium">Contrat signé (PDF)</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(contrat.documentUrl, '_blank')}
                    className="h-8 px-3"
                  >
                    <Eye className="size-4 mr-2" />
                    Plein écran
                  </Button>
                </div>
                <div className="relative overflow-hidden" style={{ height: '700px' }}>
                  <iframe
                    src={`${contrat.documentUrl}#view=FitH&toolbar=1&navpanes=0`}
                    className="w-full h-full border-0"
                    title="Aperçu du contrat"
                    style={{ overflow: 'auto' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  💡 Utilisez la molette de la souris ou les touches fléchées pour naviguer dans le document
                </p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/20">
                <FileText className="size-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Aucun document disponible pour ce contrat
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Le document PDF signé n'a pas encore été téléchargé
                </p>
              </div>
            )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleTelecharger}
              className="gap-2 h-11 px-6"
            >
              <Download className="size-4" />
              Télécharger PDF
            </Button>
            {contrat.actif && onRenouveler && (
              <Button
                variant="outline"
                onClick={() => onRenouveler(contrat)}
                className="gap-2 h-11 px-6"
              >
                <RefreshCw className="size-4" />
                Renouveler
              </Button>
            )}
            <Button
              onClick={onFermer}
              className="h-11 px-6"
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
