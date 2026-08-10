"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { deposerRapport } from "@/lib/actions/missions";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

interface ModaleDeposerRapportProps {
  missionId: string;
  employeId: string;
  reference: string;
}

export function ModaleDeposerRapport({ missionId, employeId, reference }: ModaleDeposerRapportProps) {
  const [ouvert, setOuvert] = useState(false);
  const [etape, setEtape] = useState(1);
  const [isPending, startTransition] = useTransition();

  const [objetRealise, setObjetRealise] = useState("");
  const [resultats, setResultats] = useState("");

  const reinitialiser = () => {
    setEtape(1);
    setObjetRealise("");
    setResultats("");
  };

  const validerEtape1 = () => {
    if (objetRealise.trim().length < 30) {
      toast.error("L'objet réalisé doit contenir au moins 30 caractères");
      return false;
    }
    if (resultats.trim().length < 30) {
      toast.error("Les résultats doivent contenir au moins 30 caractères");
      return false;
    }
    return true;
  };

  const prochaine = () => {
    if (etape === 1 && validerEtape1()) {
      setEtape(2);
    }
  };

  const precedente = () => {
    if (etape > 1) {
      setEtape(etape - 1);
    }
  };

  const soumettre = () => {
    startTransition(async () => {
      try {
        const resultat = await deposerRapport({
          missionId,
          employeId,
          objetRealise,
          resultats,
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
        toast.error("Une erreur est survenue lors du dépôt du rapport");
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOuvert(true)} size="sm" variant="outline">
        <FileText className="size-4 mr-2" />
        Déposer rapport
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rapport de mission — {reference}</DialogTitle>
            <div className="flex items-center gap-2 mt-4">
              {[1, 2].map((num) => (
                <div key={num} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center size-8 rounded-full text-sm font-medium ${
                      num === etape
                        ? "bg-primary text-primary-foreground"
                        : num < etape
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {num}
                  </div>
                  <div className="ml-2 text-sm">
                    {num === 1 && "Rédaction"}
                    {num === 2 && "Récapitulatif"}
                  </div>
                </div>
              ))}
            </div>
          </DialogHeader>

          <div className="mt-6">
            {/* Étape 1 */}
            {etape === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Décrivez les activités réalisées et les résultats obtenus.
                  Minimum 30 caractères par champ.
                </p>

                <div>
                  <Label htmlFor="objetRealise">
                    Objet réalisé * ({objetRealise.length} / 30 min)
                  </Label>
                  <Textarea
                    id="objetRealise"
                    value={objetRealise}
                    onChange={(e) => setObjetRealise(e.target.value)}
                    placeholder="Décrivez les activités réalisées pendant la mission..."
                    className="mt-1"
                    rows={4}
                  />
                  {objetRealise.length > 0 && objetRealise.length < 30 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Encore {30 - objetRealise.length} caractères nécessaires
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="resultats">
                    Résultats * ({resultats.length} / 30 min)
                  </Label>
                  <Textarea
                    id="resultats"
                    value={resultats}
                    onChange={(e) => setResultats(e.target.value)}
                    placeholder="Décrivez les résultats obtenus, les décisions prises, les points d'attention..."
                    className="mt-1"
                    rows={4}
                  />
                  {resultats.length > 0 && resultats.length < 30 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Encore {30 - resultats.length} caractères nécessaires
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Étape 2 */}
            {etape === 2 && (
              <div className="space-y-6">
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="font-medium border-b pb-2">Récapitulatif du rapport</div>

                  <div>
                    <span className="text-sm text-muted-foreground">Objet réalisé :</span>
                    <div className="mt-1 text-sm whitespace-pre-wrap">
                      {objetRealise}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">Résultats :</span>
                    <div className="mt-1 text-sm whitespace-pre-wrap">
                      {resultats}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4 text-sm">
                  <div className="font-medium mb-2">Important :</div>
                  <p className="text-muted-foreground">
                    Une fois le rapport déposé, vous pourrez créer une nouvelle demande de
                    mission. Le rapport ne pourra plus être modifié.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div>
              {etape > 1 && (
                <Button variant="ghost" onClick={precedente} disabled={isPending}>
                  <ChevronLeft className="size-4 mr-1" />
                  Précédent
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  reinitialiser();
                  setOuvert(false);
                }}
                disabled={isPending}
              >
                Annuler
              </Button>
              {etape < 2 ? (
                <Button onClick={prochaine} disabled={isPending}>
                  Suivant
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={soumettre} disabled={isPending}>
                  {isPending ? "Dépôt en cours..." : "Déposer le rapport"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
