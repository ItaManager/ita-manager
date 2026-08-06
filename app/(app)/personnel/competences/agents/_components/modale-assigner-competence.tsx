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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Lock, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {estChangement ? "Modifier la compétence" : "Assigner une compétence"}
          </DialogTitle>
          <DialogDescription>
            {agent.prenom} {agent.nom} · {agent.matricule}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                <Badge variant="outline">
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
            <Label htmlFor="competence">
              Compétence <span className="text-destructive">*</span>
            </Label>
            <Select value={competenceId} onValueChange={setCompetenceId}>
              <SelectTrigger id="competence">
                <SelectValue placeholder="Sélectionner une compétence" />
              </SelectTrigger>
              <SelectContent>
                {competences.map((comp) => {
                  const sansTaux = !comp.tauxCourant;
                  const estVerrouillee = sansTaux;

                  return (
                    <SelectItem
                      key={comp.id}
                      value={comp.id}
                      disabled={estVerrouillee}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span>{comp.libelle}</span>
                        {estVerrouillee && (
                          <Lock className="size-3 text-muted-foreground ml-auto" />
                        )}
                        {sansTaux && (
                          <Badge
                            variant="outline"
                            className="ml-auto text-xs border-orange-300 bg-orange-50 text-orange-700"
                          >
                            sans taux
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Les compétences sans taux ne peuvent pas être assignées
            </p>
          </div>

          {/* Métiers réunis (si composée) */}
          {competenceSelectionnee?.categorie === "COMPOSEE" && competenceSelectionnee.description && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
              <p className="text-xs font-medium text-blue-900 mb-1">
                Compétence composée
              </p>
              <p className="text-xs text-blue-700">
                {competenceSelectionnee.description}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Le taux est le même quel que soit le travail du jour.
              </p>
            </div>
          )}

          {/* Date d'effet */}
          <div className="space-y-2">
            <Label htmlFor="dateEffet">
              À compter du <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dateEffet"
              type="date"
              value={dateEffet}
              onChange={(e) => setDateEffet(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Les jours pointés avant cette date garderont l'ancienne compétence
            </p>
          </div>

          {/* Motif (requis si changement) */}
          <div className="space-y-2">
            <Label htmlFor="motif">
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

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              {estChangement ? "Modifier la compétence" : "Assigner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
