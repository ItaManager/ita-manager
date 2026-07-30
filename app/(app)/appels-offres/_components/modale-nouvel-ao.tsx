"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Check, Loader2 } from "lucide-react";
import { creerAppelOffres } from "@/lib/actions/appels-offres";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type Props = {
  ouvert: boolean;
  onOuvertChange: (ouvert: boolean) => void;
};

export function ModaleNouvelAO({ ouvert, onOuvertChange }: Props) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const [reference, setReference] = useState("");
  const [maitreOuvrage, setMaitreOuvrage] = useState("");
  const [objet, setObjet] = useState("");
  const [montantEstime, setMontantEstime] = useState("");
  const [dateLimiteDepot, setDateLimiteDepot] = useState("");
  const [lieu, setLieu] = useState("");
  const [typeMarche, setTypeMarche] = useState<"PUBLIC" | "PRIVE" | "INTERNATIONAL">("PUBLIC");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    if (!reference || !maitreOuvrage || !objet || !dateLimiteDepot) {
      setErreur("Veuillez remplir tous les champs obligatoires");
      return;
    }

    startTransition(async () => {
      try {
        const ao = await creerAppelOffres({
          reference,
          maitreOuvrage,
          objet,
          montantEstime: montantEstime ? parseFloat(montantEstime) : undefined,
          dateLimiteDepot: new Date(dateLimiteDepot),
          lieu: lieu || undefined,
          typeMarche,
        });

        onOuvertChange(false);
        router.push(`/appels-offres/${ao.id}`);
        router.refresh();
      } catch (error) {
        setErreur(error instanceof Error ? error.message : "Erreur lors de la création");
      }
    });
  };

  const handleClose = () => {
    if (!enCours) {
      onOuvertChange(false);
      // Réinitialiser le formulaire
      setReference("");
      setMaitreOuvrage("");
      setObjet("");
      setMontantEstime("");
      setDateLimiteDepot("");
      setLieu("");
      setTypeMarche("PUBLIC");
      setErreur(null);
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <VisuallyHidden>
          <DialogTitle>Nouvel appel d'offres</DialogTitle>
        </VisuallyHidden>

        {/* En-tête */}
        <header className="shrink-0 bg-primary-soft px-7 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-primary">Nouvel appel d'offres</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Enregistrer une nouvelle opportunité commerciale
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

        {/* Contenu */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="reference" className="text-sm font-medium">
                  Référence <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: AO-2026-001"
                  className="mt-1.5"
                  disabled={enCours}
                />
              </div>

              <div>
                <Label htmlFor="typeMarche" className="text-sm font-medium">
                  Type de marché <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={typeMarche}
                  onValueChange={(v) => setTypeMarche(v as any)}
                  disabled={enCours}
                >
                  <SelectTrigger id="typeMarche" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="PRIVE">Privé</SelectItem>
                    <SelectItem value="INTERNATIONAL">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="maitreOuvrage" className="text-sm font-medium">
                  Maître d'ouvrage <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="maitreOuvrage"
                  value={maitreOuvrage}
                  onChange={(e) => setMaitreOuvrage(e.target.value)}
                  placeholder="Nom de l'organisme"
                  className="mt-1.5"
                  disabled={enCours}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="objet" className="text-sm font-medium">
                  Objet <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="objet"
                  value={objet}
                  onChange={(e) => setObjet(e.target.value)}
                  placeholder="Description de l'appel d'offres"
                  className="mt-1.5"
                  rows={3}
                  disabled={enCours}
                />
              </div>

              <div>
                <Label htmlFor="dateLimiteDepot" className="text-sm font-medium">
                  Date limite de dépôt <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dateLimiteDepot"
                  type="date"
                  value={dateLimiteDepot}
                  onChange={(e) => setDateLimiteDepot(e.target.value)}
                  className="mt-1.5"
                  disabled={enCours}
                />
              </div>

              <div>
                <Label htmlFor="montantEstime" className="text-sm font-medium">
                  Montant estimé (FCFA)
                </Label>
                <Input
                  id="montantEstime"
                  type="number"
                  value={montantEstime}
                  onChange={(e) => setMontantEstime(e.target.value)}
                  placeholder="0"
                  className="mt-1.5"
                  disabled={enCours}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="lieu" className="text-sm font-medium">
                  Lieu
                </Label>
                <Input
                  id="lieu"
                  value={lieu}
                  onChange={(e) => setLieu(e.target.value)}
                  placeholder="Localisation du projet"
                  className="mt-1.5"
                  disabled={enCours}
                />
              </div>
            </div>

            {erreur && (
              <div className="mt-4 rounded-md bg-destructive-soft p-3">
                <p className="text-sm text-destructive">{erreur}</p>
              </div>
            )}
          </div>

          {/* Pied */}
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
              Créer
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
