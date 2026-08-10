"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { visaerN1 } from "@/lib/actions/missions";
import { Check, X } from "lucide-react";

interface ModaleViserN1Props {
  missionId: string;
  reference: string;
  employeId: string;
}

export function ModaleViserN1({ missionId, reference, employeId }: ModaleViserN1Props) {
  const [ouvert, setOuvert] = useState(false);
  const [decision, setDecision] = useState<"VALIDER" | "REFUSER" | null>(null);
  const [motif, setMotif] = useState("");
  const [isPending, startTransition] = useTransition();

  const reinitialiser = () => {
    setDecision(null);
    setMotif("");
  };

  const soumettre = () => {
    if (!decision) return;

    if (decision === "REFUSER") {
      if (!motif.trim()) {
        toast.error("Le motif du refus est obligatoire");
        return;
      }
      if (motif.trim().length < 20) {
        toast.error("Le motif du refus doit contenir au moins 20 caractères");
        return;
      }
    }

    startTransition(async () => {
      try {
        const resultat = await visaerN1({
          missionId,
          decision,
          motif: motif.trim() || undefined,
          employeId,
        });

        if (resultat.success) {
          toast.success(resultat.message);
          reinitialiser();
          setOuvert(false);
          window.location.reload();
        } else {
          toast.error(resultat.message);
        }
      } catch (error) {
        toast.error("Une erreur est survenue");
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOuvert(true)} size="sm">
        Viser
      </Button>

      <Dialog
        open={ouvert}
        onOpenChange={(open) => {
          if (!open) {
            reinitialiser();
          }
          setOuvert(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Visa N+1 — {reference}</DialogTitle>
            <DialogDescription>
              Cette mission a-t-elle lieu d'être ? Puis-je me passer de cette personne pendant ces jours-là ?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {!decision ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Choisissez votre décision :
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setDecision("VALIDER")}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Check className="size-5 text-green-600" />
                    <span>Viser</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDecision("REFUSER")}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <X className="size-5 text-red-600" />
                    <span>Refuser</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`rounded-md p-3 ${
                    decision === "VALIDER"
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {decision === "VALIDER" ? (
                      <Check className="size-5 text-green-600" />
                    ) : (
                      <X className="size-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {decision === "VALIDER"
                        ? "Visa de la mission"
                        : "Refus de la mission"}
                    </span>
                  </div>
                </div>

                {decision === "REFUSER" && (
                  <div>
                    <Label htmlFor="motif">
                      Motif du refus * <span className="text-muted-foreground font-normal">(minimum 20 caractères)</span>
                    </Label>
                    <Textarea
                      id="motif"
                      value={motif}
                      onChange={(e) => setMotif(e.target.value)}
                      placeholder="Indiquez le motif du refus..."
                      className="mt-1"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {motif.length}/20 caractères minimum
                    </p>
                  </div>
                )}

                {decision === "VALIDER" && (
                  <div>
                    <Label htmlFor="motif">Commentaire (optionnel)</Label>
                    <Textarea
                      id="motif"
                      value={motif}
                      onChange={(e) => setMotif(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                if (decision) {
                  setDecision(null);
                } else {
                  reinitialiser();
                  setOuvert(false);
                }
              }}
              disabled={isPending}
            >
              {decision ? "Retour" : "Annuler"}
            </Button>

            {decision && (
              <Button onClick={soumettre} disabled={isPending}>
                {isPending ? "Traitement..." : "Confirmer"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
