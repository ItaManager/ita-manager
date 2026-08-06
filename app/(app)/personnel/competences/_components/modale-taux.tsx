"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { fixerTaux } from "@/lib/actions/competences";
import type { CompetenceListItem } from "@/lib/actions/competences";
import { toast } from "sonner";

interface ModaleTauxProps {
  ouvert: boolean;
  onClose: () => void;
  competence: CompetenceListItem;
  mode: "fixer" | "reviser";
}

export function ModaleTaux({
  ouvert,
  onClose,
  competence,
  mode,
}: ModaleTauxProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [montant, setMontant] = useState("");
  const [dateEffet, setDateEffet] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [motif, setMotif] = useState("");

  const estPremiereTaux = !competence.tauxCourant;
  const ancienMontant = competence.tauxCourant
    ? parseFloat(competence.tauxCourant.montant)
    : 0;
  const nouveauMontant = parseFloat(montant) || 0;
  const variation =
    ancienMontant > 0
      ? ((nouveauMontant - ancienMontant) / ancienMontant) * 100
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!montant || parseFloat(montant) <= 0) {
      toast.error("Le montant doit être supérieur à zéro");
      return;
    }

    if (!dateEffet) {
      toast.error("La date d'effet est requise");
      return;
    }

    if (!estPremiereTaux && (!motif || motif.trim().length < 20)) {
      toast.error("Le motif doit comporter au moins 20 caractères");
      return;
    }

    startTransition(async () => {
      const result = await fixerTaux({
        competenceId: competence.id,
        montant: parseFloat(montant),
        dateEffet: new Date(dateEffet),
        motif: motif.trim() || undefined,
      });

      if (result.success) {
        toast.success(result.message);
        router.refresh();
        onClose();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {estPremiereTaux
              ? "Fixer le taux journalier"
              : "Réviser le taux journalier"}
          </DialogTitle>
          <DialogDescription>
            {estPremiereTaux
              ? `Fixer le premier taux journalier pour "${competence.libelle}"`
              : `Réviser le taux journalier de "${competence.libelle}"`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bandeau première fixation */}
          {estPremiereTaux && (
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
              <AlertCircle className="size-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-900">
                <p>
                  <strong>Première fixation.</strong> Cette compétence a été
                  créée le{" "}
                  {new Date(competence.creeLe).toLocaleDateString("fr-FR")}.
                  Elle ne peut pas être assignée tant qu'aucun taux n'est fixé.
                </p>
              </div>
            </div>
          )}

          {/* Variation si révision */}
          {!estPremiereTaux && nouveauMontant > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {ancienMontant.toLocaleString("fr-FR")} F →{" "}
                    {nouveauMontant.toLocaleString("fr-FR")} F
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {competence.nombreAgents} agent
                    {competence.nombreAgents > 1 ? "s" : ""} concerné
                    {competence.nombreAgents > 1 ? "s" : ""}
                  </p>
                </div>
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
                    <TrendingUp className="size-4" />
                  ) : variation < 0 ? (
                    <TrendingDown className="size-4" />
                  ) : null}
                  {variation > 0 ? "+" : ""}
                  {variation.toFixed(1)} %
                </div>
              </div>
            </div>
          )}

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="montant">
              Montant par jour (FCFA) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="montant"
              type="number"
              min="0"
              step="1"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="Ex: 7500"
              required
            />
            <p className="text-xs text-muted-foreground">
              Montant entier en francs CFA
            </p>
          </div>

          {/* Date d'effet */}
          <div className="space-y-2">
            <Label htmlFor="dateEffet">
              Date d'effet <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dateEffet"
              type="date"
              value={dateEffet}
              onChange={(e) => setDateEffet(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Les jours pointés à partir de cette date utiliseront ce taux
            </p>
          </div>

          {/* Motif (requis si révision) */}
          <div className="space-y-2">
            <Label htmlFor="motif">
              Motif{" "}
              {!estPremiereTaux && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder={
                estPremiereTaux
                  ? "Optionnel pour la première fixation"
                  : "Minimum 20 caractères — Ex: Ajustement inflation 2026"
              }
              rows={3}
              required={!estPremiereTaux}
            />
            {!estPremiereTaux && (
              <p className="text-xs text-muted-foreground">
                {motif.trim().length}/20 caractères minimum
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              {estPremiereTaux ? "Fixer le taux" : "Réviser le taux"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
