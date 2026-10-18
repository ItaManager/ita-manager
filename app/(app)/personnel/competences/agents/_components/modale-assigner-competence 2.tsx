"use client";

import { useState, useTransition, useEffect } from "react";
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
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { AlertCircle, Lock, TrendingUp, TrendingDown, Loader2, Check } from "lucide-react";
import { assignerCompetence, listerCompetences } from "@/lib/actions/competences";
import type { CompetenceListItem } from "@/lib/actions/competences";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface AgentItem {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  competence: {
    id: string;
    libelle: string;
    categorie: string;
    dateEffet: Date;
  } | null;
  taux: {
    montant: string;
    dateEffet: Date;
  } | null;
}

interface ModaleAssignerCompetenceProps {
  ouvert: boolean;
  onClose: () => void;
  agent: AgentItem;
}

export function ModaleAssignerCompetence({
  ouvert,
  onClose,
  agent,
}: ModaleAssignerCompetenceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [competences, setCompetences] = useState<CompetenceListItem[]>([]);
  const [competenceId, setCompetenceId] = useState("");
  const [dateEffet, setDateEffet] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [motif, setMotif] = useState("");

  const estChangement = !!agent.competence;

  // Charger les compétences
  useEffect(() => {
    if (ouvert) {
      listerCompetences({ actives: true }).then((result) => {
        setCompetences(result);
      });
    }
  }, [ouvert]);

  // Compétence sélectionnée
  const competenceSelectionnee = competences.find((c) => c.id === competenceId);

  // Calcul variation de taux
  let variation: number | null = null;
  if (estChangement && agent.taux && competenceSelectionnee?.tauxCourant) {
    const ancienMontant = parseFloat(agent.taux.montant);
    const nouveauMontant = parseFloat(competenceSelectionnee.tauxCourant.montant);
    variation = ((nouveauMontant - ancienMontant) / ancienMontant) * 100;
  }

  // Options pour le Combobox
  const competenceOptions: ComboboxOption[] = competences.map((comp) => ({
    value: comp.id,
    label: comp.libelle,
    disabled: !comp.tauxCourant,
    description: comp.tauxCourant
      ? `${parseFloat(comp.tauxCourant.montant).toLocaleString("fr-FR")} F/jour`
      : undefined,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!competenceId) {
      toast.error("Veuillez sélectionner une compétence");
      return;
    }

    if (!dateEffet) {
      toast.error("La date d'effet est requise");
      return;
    }

    if (estChangement && (!motif || motif.trim().length < 15)) {
      toast.error("Le motif doit comporter au moins 15 caractères");
      return;
    }

    startTransition(async () => {
      const result = await assignerCompetence({
        employeId: agent.id,
        competenceId,
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
            {estChangement ? "Modifier la compétence" : "Assigner une compétence"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {agent.prenom} {agent.nom} · {agent.matricule}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {/* Rappel compétence actuelle */}
          {estChangement && agent.competence && (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Compétence actuelle
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {agent.competence.libelle}
                  </p>
                  {agent.taux && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {parseFloat(agent.taux.montant).toLocaleString("fr-FR")} F
                      par jour
                    </p>
                  )}
                </div>
                <Badge variant="secondary">
                  Depuis{" "}
                  {new Date(agent.competence.dateEffet).toLocaleDateString(
                    "fr-FR"
                  )}
                </Badge>
              </div>
            </div>
          )}

          {/* Variation de taux */}
          {estChangement && variation !== null && competenceSelectionnee && (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {agent.taux && parseFloat(agent.taux.montant).toLocaleString("fr-FR")} F →{" "}
                    {parseFloat(competenceSelectionnee.tauxCourant!.montant).toLocaleString("fr-FR")} F
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Variation du taux journalier
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

          {/* Compétence */}
          <div className="space-y-2">
            <Label htmlFor="competence" className="text-sm font-medium">
              Compétence <span className="text-destructive">*</span>
            </Label>
            <Combobox
              options={competenceOptions}
              value={competenceId}
              onChange={setCompetenceId}
              placeholder="Sélectionner une compétence"
              searchPlaceholder="Rechercher une compétence..."
              emptyText="Aucune compétence trouvée"
              className="h-11"
              renderOption={(option) => {
                const comp = competences.find((c) => c.id === option.value);
                const sansTaux = !comp?.tauxCourant;

                return (
                  <>
                    {option.disabled && (
                      <Lock className="size-4 text-muted-foreground mr-2" />
                    )}
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex-1">
                        <div className={option.disabled ? "text-muted-foreground" : ""}>
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        )}
                      </div>
                      {sansTaux && (
                        <Badge
                          variant="outline"
                          className="text-xs border-orange-300 bg-orange-50 text-orange-700"
                        >
                          sans taux
                        </Badge>
                      )}
                    </div>
                    <Check
                      className={`ml-2 h-4 w-4 ${
                        competenceId === option.value ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </>
                );
              }}
            />
            <p className="text-xs text-muted-foreground">
              Les compétences sans taux ne peuvent pas être assignées
            </p>
          </div>

          {/* Métiers réunis (si composée) */}
          {competenceSelectionnee?.categorie === "COMPOSEE" && competenceSelectionnee.description && (
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
              <AlertCircle className="size-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-900">
                <p className="font-medium mb-1">
                  Compétence composée
                </p>
                <p className="text-blue-700">
                  {competenceSelectionnee.description}
                </p>
                <p className="text-blue-600 mt-1">
                  Le taux est le même quel que soit le travail du jour.
                </p>
              </div>
            </div>
          )}

          {/* Date d'effet */}
          <div className="space-y-2">
            <Label htmlFor="dateEffet" className="text-sm font-medium">
              À compter du <span className="text-destructive">*</span>
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
              Les jours pointés avant cette date garderont l'ancienne compétence
            </p>
          </div>

          {/* Motif (requis si changement) */}
          <div className="space-y-2">
            <Label htmlFor="motif" className="text-sm font-medium">
              Motif {estChangement && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder={
                estChangement
                  ? "Minimum 15 caractères — Ex: Montée en compétence validée"
                  : "Optionnel pour la première assignation"
              }
              rows={3}
              required={estChangement}
            />
            {estChangement && (
              <p className="text-xs text-muted-foreground">
                {motif.trim().length}/15 caractères minimum
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 px-6 py-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#13850b] hover:bg-[#0f6909] text-white"
            >
              {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              {estChangement ? "Modifier la compétence" : "Assigner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
