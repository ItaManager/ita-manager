"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { validerRH } from "@/lib/actions/missions";
import { Check, X } from "lucide-react";

interface ModaleValiderRHProps {
  missionId: string;
  reference: string;
}

export function ModaleValiderRH({ missionId, reference }: ModaleValiderRHProps) {
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

    if (decision === "REFUSER" && !motif.trim()) {
      toast.error("Le motif du refus est obligatoire");
      return;
    }

    startTransition(async () => {
      try {
        const resultat = await validerRH({
          missionId,
          decision,
          motif: motif.trim() || undefined,
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
        Traiter
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
            <DialogTitle>Validation RH — {reference}</DialogTitle>
            <DialogDescription>
              Valider ou refuser cette demande de mission
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
                    <span>Valider</span>
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
                        ? "Validation de la mission"
                        : "Refus de la mission"}
                    </span>
                  </div>
                </div>

                {decision === "REFUSER" && (
                  <div>
                    <Label htmlFor="motif">Motif du refus *</Label>
                    <Textarea
                      id="motif"
                      value={motif}
                      onChange={(e) => setMotif(e.target.value)}
                      placeholder="Indiquez le motif du refus..."
                      className="mt-1"
                      rows={4}
                    />
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
