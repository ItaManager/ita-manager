"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getBadgeClasses } from "@/lib/ui/badge-styles";

interface ModaleDetailDemandeProps {
  ouvert: boolean;
  onClose: () => void;
  demande: {
    id: string;
    reference: string;
    demandeur: string;
    materiel: string;
    matricule: string;
    typeCarburant: string;
    quantite: number;
    compteurActuel?: number;
    uniteCompteur?: string;
    circuit: string;
    statut: string;
    creeLe: Date;
    projetNom?: string;
  } | null;
}

export function ModaleDetailDemande({
  ouvert,
  onClose,
  demande,
}: ModaleDetailDemandeProps) {
  if (!demande) return null;

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="border-b border-border px-6 py-4" style={{ backgroundColor: 'var(--primary-soft)' }}>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-[#1D186C]">
                Détails de la demande
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Référence : {demande.reference}
              </DialogDescription>
            </div>
            <Badge className={getBadgeClasses("carburant", demande.statut)}>
              {demande.statut === "BROUILLON" && "Brouillon"}
              {demande.statut === "ATTENTE_VALIDATION" && "En attente"}
              {demande.statut === "VALIDEE" && "Validée"}
              {demande.statut === "LIVREE" && "Livrée"}
              {demande.statut === "REFUSEE" && "Refusée"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-4">
          {/* Date de la demande */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Date de la demande
            </Label>
            <Input
              value={demande.creeLe.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              disabled
              className="h-11 bg-muted"
            />
          </div>

          {/* Demandeur */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Demandeur
            </Label>
            <Input
              value={demande.demandeur}
              disabled
              className="h-11 bg-muted"
            />
          </div>

          {/* Véhicule et Matricule */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Véhicule / Engin
              </Label>
              <Input
                value={demande.materiel}
                disabled
                className="h-11 bg-muted font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Matricule
              </Label>
              <Input
                value={demande.matricule}
                disabled
                className="h-11 bg-muted font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Type de carburant */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Type de carburant
              </Label>
              <Input
                value={demande.typeCarburant === "GASOIL" ? "Gasoil" : "Super"}
                disabled
                className="h-11 bg-muted"
              />
            </div>

            {/* Quantité souhaitée */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Quantité (litres)
              </Label>
              <Input
                value={demande.quantite.toLocaleString("fr-FR")}
                disabled
                className="h-11 bg-muted tabular-nums"
              />
            </div>
          </div>

          {demande.compteurActuel && (
            <div className="grid grid-cols-2 gap-5">
              {/* Compteur actuel */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Compteur actuel
                </Label>
                <Input
                  value={demande.compteurActuel.toLocaleString("fr-FR")}
                  disabled
                  className="h-11 bg-muted tabular-nums"
                />
              </div>

              {/* Unité compteur */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Unité
                </Label>
                <Input
                  value={demande.uniteCompteur === "KILOMETRE" ? "Kilomètres" : "Heures"}
                  disabled
                  className="h-11 bg-muted"
                />
              </div>
            </div>
          )}

          {/* Circuit */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Circuit
            </Label>
            <Input
              value={demande.circuit === "STATION" ? "Station-service" : "Garage ITA"}
              disabled
              className="h-11 bg-muted"
            />
          </div>

          {/* Projet (optionnel) */}
          {demande.projetNom && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Projet
              </Label>
              <Input
                value={demande.projetNom}
                disabled
                className="h-11 bg-muted"
              />
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
