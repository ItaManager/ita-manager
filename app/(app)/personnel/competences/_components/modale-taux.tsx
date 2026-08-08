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
import { AlertCircle, TrendingUp, TrendingDown, Loader2, Check } from "lucide-react";
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
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="border-b border-border px-6 py-4" style={{ backgroundColor: 'var(--primary-soft)' }}>
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            {estPremiereTaux
              ? "Fixer le taux journalier"
              : "Réviser le taux journalier"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {competence.libelle} · Direction Financière
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {/* Bandeau première fixation */}
          {estPremiereTaux && (
            <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
              <AlertCircle className="size-4 text-orange-600 mt-0.5 shrink-0" />
              <div className="text-xs text-orange-900">
                <p>
                  Créée par la Direction Technique le{" "}
                  {new Date(competence.creeLe).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}. <strong className="text-orange-700">En attente de votre validation.</strong> Tant qu'aucun taux n'est fixé, cette compétence ne peut pas être assignée.
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

          {/* Montant et Date d'effet côte à côte */}
          <div className="grid grid-cols-2 gap-4">
            {/* Montant */}
            <div className="space-y-2">
              <Label htmlFor="montant" className="text-sm font-medium">
                Montant par jour <span className="text-destructive">*</span>
              </Label>
              <Input
                id="montant"
                type="number"
                min="0"
                step="1"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="8000"
                required
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                En francs CFA
              </p>
            </div>

            {/* Date d'effet */}
            <div className="space-y-2">
              <Label htmlFor="dateEffet" className="text-sm font-medium">
                Date d'effet <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateEffet"
                type="date"
                value={dateEffet}
                onChange={(e) => setDateEffet(e.target.value)}
                required
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Les jours pointés avant gardent l'ancien taux
              </p>
            </div>
          </div>

          {/* Info taux non modifiable */}
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
            <AlertCircle className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong>Un taux ne se modifie pas, il se remplace.</strong> Le précédent reste consultable — c'est ce qui rend une paie de mars justifiable en octobre.
            </p>
          </div>

          {/* Motif (requis si révision) */}
          {!estPremiereTaux && (
            <div className="space-y-2">
              <Label htmlFor="motif" className="text-sm font-medium">
                Motif <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="motif"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Ajustement inflation 2026..."
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground">
                {motif.trim().length}/20 caractères minimum
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 px-6 py-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#13850b] hover:bg-[#0f6909] text-white rounded-full gap-1.5"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Valider le taux
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
