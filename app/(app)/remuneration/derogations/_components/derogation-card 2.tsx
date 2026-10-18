"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deciderDerogation } from "@/lib/actions/employes";

interface DerogationCardProps {
  derogation: {
    id: string;
    montant: { toString: () => string } | number;
    niveauMin: { toString: () => string } | number;
    niveauMax: { toString: () => string } | number;
    motif: string;
    statut: string;
    demandeLe: Date;
    decideLe: Date | null;
    commentaire: string | null;
    ecartPourcent: number;
    employe: {
      id: string;
      matricule: string;
      nom: string;
      prenom: string;
      affectations: Array<{
        poste: {
          libelle: string;
          direction: { libelle: string };
        };
      }>;
    };
  };
  sessionUserId: string;
}

export function DerogationCard({
  derogation,
}: DerogationCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [decision, setDecision] = useState<"VALIDEE" | "REFUSEE" | null>(
    null
  );
  const [motifRefus, setMotifRefus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const montant = Number(derogation.montant);
  const niveauMin = Number(derogation.niveauMin);
  const niveauMax = Number(derogation.niveauMax);
  const { ecartPourcent } = derogation;

  const posteActuel = derogation.employe.affectations[0]?.poste;

  // Badge écart : <10% (orange), 10-20% (red), >20% (destructive)
  const getBadgeEcart = () => {
    const absEcart = Math.abs(ecartPourcent);
    if (absEcart < 10) {
      return (
        <Badge variant="outline" className="border-warning text-warning">
          +{ecartPourcent}%
        </Badge>
      );
    } else if (absEcart < 20) {
      return (
        <Badge variant="outline" className="border-destructive text-destructive">
          +{ecartPourcent}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="font-semibold">
          +{ecartPourcent}%
        </Badge>
      );
    }
  };

  const openDecisionDialog = (dec: "VALIDEE" | "REFUSEE") => {
    setDecision(dec);
    setMotifRefus("");
    setError(null);
    setIsDialogOpen(true);
  };

  const handleSubmitDecision = async () => {
    if (!decision) return;

    // Validation : motif obligatoire si refus
    if (decision === "REFUSEE" && motifRefus.trim().length === 0) {
      setError("Le motif de refus est obligatoire.");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        await deciderDerogation({
          derogationId: derogation.id,
          decision,
          commentaire: decision === "REFUSEE" ? motifRefus : undefined,
        });

        setIsDialogOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  };

  const getBadgeStatut = () => {
    if (derogation.statut === "EN_ATTENTE") {
      return (
        <Badge variant="outline" className="border-warning text-warning">
          En attente
        </Badge>
      );
    } else if (derogation.statut === "VALIDEE") {
      return (
        <Badge variant="outline" className="border-success text-success">
          Validée
        </Badge>
      );
    } else if (derogation.statut === "REFUSEE") {
      return (
        <Badge variant="outline" className="border-destructive text-destructive">
          Refusée
        </Badge>
      );
    }
    return null;
  };

  return (
    <>
      <div className="border rounded-lg p-4 bg-background">
        {/* En-tête : employé + salaire */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-medium">
              {derogation.employe.prenom} {derogation.employe.nom}
            </div>
            <div className="text-sm text-muted-foreground">
              {derogation.employe.matricule}
              {posteActuel && (
                <>
                  {" "}
                  · {posteActuel.libelle} ({posteActuel.direction.libelle})
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold">
                {montant.toLocaleString("fr-FR")} FCFA
              </div>
              {getBadgeEcart()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Fourchette : {niveauMin.toLocaleString("fr-FR")} -{" "}
              {niveauMax.toLocaleString("fr-FR")}
            </div>
          </div>
        </div>

        {/* Motif */}
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">Motif :</div>
          <div className="text-sm">{derogation.motif}</div>
        </div>

        {/* Footer : date + actions ou statut */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Demandée le{" "}
            {format(new Date(derogation.demandeLe), "d MMMM yyyy à HH:mm", {
              locale: fr,
            })}
          </div>

          {derogation.statut === "EN_ATTENTE" ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => openDecisionDialog("REFUSEE")}
                disabled={isPending}
              >
                <XCircle className="size-3.5" />
                Refuser
              </Button>
              <Button
                size="sm"
                className="rounded-full bg-success text-success-foreground hover:bg-success/90"
                onClick={() => openDecisionDialog("VALIDEE")}
                disabled={isPending}
              >
                <CheckCircle2 className="size-3.5" />
                Valider
              </Button>
            </div>
          ) : (
            <div className="text-right">
              {getBadgeStatut()}
              {derogation.decideLe && (
                <div className="text-xs text-muted-foreground mt-1">
                  {format(new Date(derogation.decideLe), "d MMM yyyy", {
                    locale: fr,
                  })}
                </div>
              )}
              {derogation.commentaire && derogation.statut === "REFUSEE" && (
                <div className="text-xs text-muted-foreground mt-1">
                  Motif : {derogation.commentaire}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de décision */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {decision === "VALIDEE"
                ? "Valider la dérogation"
                : "Refuser la dérogation"}
            </DialogTitle>
            <DialogDescription>
              {decision === "VALIDEE" ? (
                <>
                  Vous êtes sur le point de valider la dérogation salariale pour{" "}
                  <strong>
                    {derogation.employe.prenom} {derogation.employe.nom}
                  </strong>{" "}
                  au montant de{" "}
                  <strong>{montant.toLocaleString("fr-FR")} FCFA</strong>.
                </>
              ) : (
                <>
                  Vous êtes sur le point de refuser la dérogation salariale pour{" "}
                  <strong>
                    {derogation.employe.prenom} {derogation.employe.nom}
                  </strong>
                  . Le motif de refus est obligatoire.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {decision === "REFUSEE" && (
            <div className="space-y-2">
              <Label htmlFor="motif-refus">
                Motif du refus <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="motif-refus"
                placeholder="Expliquez la raison du refus (salaire trop élevé, motif insuffisant, etc.)"
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitDecision}
              disabled={isPending}
              className={
                decision === "VALIDEE"
                  ? "bg-success hover:bg-success/90"
                  : "bg-destructive hover:bg-destructive/90"
              }
            >
              {isPending
                ? "Traitement..."
                : decision === "VALIDEE"
                  ? "Valider"
                  : "Refuser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
