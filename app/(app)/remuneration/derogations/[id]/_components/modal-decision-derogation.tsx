"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle } from "lucide-react";
import { statuerDerogation } from "@/lib/actions/remuneration";

interface ModalDecisionDerogationProps {
  derogationId: string;
  decision: "VALIDEE" | "REFUSEE";
  employeNom: string;
  montant: number;
}

export function ModalDecisionDerogation({
  derogationId,
  decision,
  employeNom,
  montant,
}: ModalDecisionDerogationProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState("");

  const handleSubmit = () => {
    // Validation : motif obligatoire si refus
    if (decision === "REFUSEE" && commentaire.trim().length === 0) {
      setError("Le motif de refus est obligatoire.");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        await statuerDerogation(
          derogationId,
          decision,
          decision === "REFUSEE" ? commentaire : undefined
        );

        setIsOpen(false);
        router.push("/remuneration/derogations");
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue"
        );
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {decision === "VALIDEE" ? (
          <Button size="sm" className="rounded-full bg-success hover:bg-success/90">
            <CheckCircle2 className="size-4" />
            Valider
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <XCircle className="size-4" />
            Refuser
          </Button>
        )}
      </DialogTrigger>

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
                <strong>{employeNom}</strong> au montant de{" "}
                <strong>{montant.toLocaleString("fr-FR")} FCFA</strong>.
              </>
            ) : (
              <>
                Vous êtes sur le point de refuser la dérogation salariale pour{" "}
                <strong>{employeNom}</strong>. Le motif de refus est obligatoire.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Commentaire (obligatoire si refus) */}
          <div className="space-y-2">
            <Label htmlFor="commentaire">
              {decision === "VALIDEE" ? "Commentaire (optionnel)" : "Motif du refus"}
              {decision === "REFUSEE" && (
                <span className="text-destructive"> *</span>
              )}
            </Label>
            <Textarea
              id="commentaire"
              placeholder={
                decision === "VALIDEE"
                  ? "Ajoutez un commentaire si nécessaire..."
                  : "Expliquez la raison du refus (salaire trop élevé, motif insuffisant, etc.)"
              }
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={4}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Avertissement pour validation */}
          {decision === "VALIDEE" && (
            <div className="border border-info bg-info-soft/30 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                <strong>Important :</strong> Une fois validée, cette dérogation
                autorise le salaire hors grille. L'employé sera inclus dans les
                exports de paie.
              </p>
            </div>
          )}

          {/* Avertissement pour refus */}
          {decision === "REFUSEE" && (
            <div className="border border-warning bg-warning-soft/30 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                <strong>Important :</strong> En cas de refus, le salaire devra
                être ajusté pour rentrer dans la fourchette de la grille.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
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
                ? "Valider la dérogation"
                : "Refuser la dérogation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
