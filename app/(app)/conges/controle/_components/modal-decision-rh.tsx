"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { deciderRH } from "@/lib/actions/conges";
import type { Decimal } from "@prisma/client/runtime/library";

type DemandeItem = {
  id: string;
  employe: {
    matricule: string;
    nom: string;
    prenom: string;
  };
  typeAbsence: string;
  dateDebut: Date;
  dateFin: Date;
  nombreJours: Decimal;
  motif: string | null;
  soumieLe: Date;
  decisionN1Le: Date;
  decompte: boolean;
};

type Props = {
  ouvert: boolean;
  onOuvertChange: (ouvert: boolean) => void;
  demande: DemandeItem;
  onSuccess: () => void;
};

export function ModalDecisionRH({
  ouvert,
  onOuvertChange,
  demande,
  onSuccess,
}: Props) {
  const [decision, setDecision] = useState<"VALIDER" | "REFUSER" | null>(null);
  const [motif, setMotif] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!decision) return;

    // Validation : motif obligatoire pour refus
    if (decision === "REFUSER" && !motif.trim()) {
      alert("Le motif du refus est obligatoire");
      return;
    }

    setLoading(true);
    try {
      await deciderRH({
        absenceId: demande.id,
        decision,
        motif: motif.trim() || undefined,
      });
      // Reset
      setDecision(null);
      setMotif("");
      onOuvertChange(false);
      onSuccess();
    } catch (error: any) {
      alert(error.message || "Erreur lors de la décision");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setDecision(null);
    setMotif("");
    onOuvertChange(false);
  }

  return (
    <Dialog open={ouvert} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Contrôle RH — Décision finale</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Résumé de la demande */}
          <div className="rounded-md border bg-muted/50 p-4">
            <p className="font-medium">
              {demande.employe.prenom} {demande.employe.nom}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Matricule : {demande.employe.matricule}
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {demande.typeAbsence}
            </p>
            <p className="mt-1 text-sm">
              Du{" "}
              {format(new Date(demande.dateDebut), "d MMMM yyyy", {
                locale: fr,
              })}{" "}
              au{" "}
              {format(new Date(demande.dateFin), "d MMMM yyyy", {
                locale: fr,
              })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {demande.nombreJours.toString()} jour
              {Number(demande.nombreJours) > 1 ? "s" : ""}
              {demande.decompte && " · Décompté du solde"}
            </p>
            {demande.motif && (
              <p className="mt-2 text-sm italic">
                Motif du collaborateur : {demande.motif}
              </p>
            )}
            <p className="mt-2 text-xs text-success">
              ✓ Validée par le supérieur le{" "}
              {format(new Date(demande.decisionN1Le), "d MMM à HH:mm", {
                locale: fr,
              })}
            </p>
          </div>

          {/* Phase 6 : Afficher solde disponible et après décompte */}
          {demande.decompte && (
            <div className="rounded-md border border-warning-border bg-warning-soft p-3">
              <p className="text-sm font-medium text-warning">
                Vérification du solde
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Le calcul du solde sera disponible en Phase 6
              </p>
            </div>
          )}

          {/* Choix de décision */}
          {!decision && (
            <div className="space-y-3">
              <Label>Décision RH</Label>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={() => setDecision("VALIDER")}
                >
                  <Check className="size-4" />
                  Valider
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-full"
                  onClick={() => setDecision("REFUSER")}
                >
                  <X className="size-4" />
                  Refuser
                </Button>
              </div>
            </div>
          )}

          {/* Confirmation validation */}
          {decision === "VALIDER" && (
            <div className="space-y-3">
              <div className="rounded-md border border-success-border bg-success-soft p-4">
                <p className="text-sm font-medium text-success">
                  Validation RH — Absence accordée
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  L'absence sera enregistrée et le solde mis à jour (Phase 6). Le
                  collaborateur sera notifié de l'accord définitif.
                </p>
              </div>

              {/* Motif optionnel pour validation */}
              <div className="space-y-2">
                <Label htmlFor="motif-validation">
                  Commentaire (facultatif)
                </Label>
                <Textarea
                  id="motif-validation"
                  placeholder="Ajoutez un commentaire si nécessaire..."
                  rows={3}
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Motif obligatoire pour refus */}
          {decision === "REFUSER" && (
            <div className="space-y-3">
              <div className="rounded-md border border-destructive bg-destructive/10 p-4">
                <p className="text-sm font-medium text-destructive">
                  Refus RH — Absence refusée
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Le refus RH annule la validation du supérieur. La demande est
                  définitivement refusée.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motif-refus">
                  Motif du refus <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="motif-refus"
                  placeholder="Expliquez la raison du refus (ex: solde insuffisant, pièce manquante...)..."
                  rows={4}
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Le motif sera visible par le collaborateur et conservé dans
                  l'historique.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between border-t pt-4">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="rounded-full"
          >
            {decision ? "Retour" : "Annuler"}
          </Button>

          {decision && (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              variant={decision === "VALIDER" ? "default" : "destructive"}
              className="rounded-full"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : decision === "VALIDER" ? (
                <Check className="size-4" />
              ) : (
                <X className="size-4" />
              )}
              Confirmer {decision === "VALIDER" ? "la validation" : "le refus"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
