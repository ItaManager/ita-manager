"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Check, Loader2 } from "lucide-react";
import { enregistrerResultat } from "@/lib/actions/appels-offres";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type Props = {
  appelOffresId: string;
  ouvert: boolean;
  onOuvertChange: (ouvert: boolean) => void;
};

export function ModaleResultat({ appelOffresId, ouvert, onOuvertChange }: Props) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const [gagne, setGagne] = useState(false);
  const [montantAttribution, setMontantAttribution] = useState("");
  const [attributaire, setAttributaire] = useState("");
  const [dateNotification, setDateNotification] = useState("");
  const [creerProjet, setCreerProjet] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    if (!gagne && !attributaire) {
      setErreur("Veuillez indiquer le nom de l'attributaire");
      return;
    }

    startTransition(async () => {
      try {
        await enregistrerResultat(appelOffresId, {
          gagne,
          montantAttribution: montantAttribution ? parseFloat(montantAttribution) : undefined,
          attributaire: attributaire || undefined,
          dateNotification: dateNotification ? new Date(dateNotification) : undefined,
          creerProjet: gagne && creerProjet,
        });
        onOuvertChange(false);
        router.refresh();
      } catch (error) {
        setErreur(error instanceof Error ? error.message : "Erreur");
      }
    });
  };

  const handleClose = () => {
    if (!enCours) {
      onOuvertChange(false);
      setGagne(false);
      setMontantAttribution("");
      setAttributaire("");
      setDateNotification("");
      setCreerProjet(false);
      setErreur(null);
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <VisuallyHidden>
          <DialogTitle>Enregistrer le résultat</DialogTitle>
        </VisuallyHidden>

        <header className="shrink-0 bg-primary-soft px-7 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-primary">Enregistrer le résultat</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Attribution du marché
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleClose}
              disabled={enCours}
              className="h-8 rounded-full bg-background shadow-sm hover:bg-background/80"
            >
              <X className="size-3.5" />
              Fermer
            </Button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
            <div className="space-y-5">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gagne"
                  checked={gagne}
                  onCheckedChange={(checked) => setGagne(!!checked)}
                  disabled={enCours}
                />
                <Label
                  htmlFor="gagne"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Marché remporté
                </Label>
              </div>

              <div>
                <Label htmlFor="montantAttribution" className="text-sm font-medium">
                  Montant d'attribution (FCFA)
                </Label>
                <Input
                  id="montantAttribution"
                  type="number"
                  value={montantAttribution}
                  onChange={(e) => setMontantAttribution(e.target.value)}
                  placeholder="0"
                  className="mt-1.5"
                  disabled={enCours}
                />
              </div>

              {!gagne && (
                <div>
                  <Label htmlFor="attributaire" className="text-sm font-medium">
                    Attributaire <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="attributaire"
                    value={attributaire}
                    onChange={(e) => setAttributaire(e.target.value)}
                    placeholder="Nom de l'entreprise attributaire"
                    className="mt-1.5"
                    disabled={enCours}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="dateNotification" className="text-sm font-medium">
                  Date de notification
                </Label>
                <Input
                  id="dateNotification"
                  type="date"
                  value={dateNotification}
                  onChange={(e) => setDateNotification(e.target.value)}
                  className="mt-1.5"
                  disabled={enCours}
                />
              </div>

              {gagne && (
                <div className="rounded-md bg-success-soft p-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="creerProjet"
                      checked={creerProjet}
                      onCheckedChange={(checked) => setCreerProjet(!!checked)}
                      disabled={enCours}
                    />
                    <Label
                      htmlFor="creerProjet"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Créer automatiquement le projet
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Un projet sera créé automatiquement depuis cet appel d'offres
                  </p>
                </div>
              )}
            </div>

            {erreur && (
              <div className="mt-4 rounded-md bg-destructive-soft p-3">
                <p className="text-sm text-destructive">{erreur}</p>
              </div>
            )}
          </div>

          <footer className="flex shrink-0 items-center justify-end gap-3 border-t px-7 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={enCours}
              className="rounded-full"
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={enCours}
              className="rounded-full bg-success text-success-foreground hover:bg-success/90"
            >
              {enCours ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Enregistrer
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
