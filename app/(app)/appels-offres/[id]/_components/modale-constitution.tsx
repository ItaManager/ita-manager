"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, FileCheck2, Loader2 } from "lucide-react";
import { passerEnConstitution } from "@/lib/actions/appels-offres";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type Props = {
  appelOffresId: string;
  ouvert: boolean;
  onOuvertChange: (ouvert: boolean) => void;
};

export function ModaleConstitution({ appelOffresId, ouvert, onOuvertChange }: Props) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const handleConfirm = () => {
    setErreur(null);

    startTransition(async () => {
      try {
        await passerEnConstitution(appelOffresId);
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
      setErreur(null);
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <VisuallyHidden>
          <DialogTitle>Passer en constitution</DialogTitle>
        </VisuallyHidden>

        <header className="shrink-0 bg-primary-soft px-7 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-primary">Passer en constitution</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Commencer la préparation du dossier de soumission
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

        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
          <p className="text-sm text-muted-foreground">
            Le dossier passera en statut <strong>Constitution</strong>. Vous pourrez alors ajouter les pièces requises et préparer la soumission.
          </p>

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
            onClick={handleConfirm}
            disabled={enCours}
            className="rounded-full bg-success text-success-foreground hover:bg-success/90"
          >
            {enCours ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileCheck2 className="size-4" />
            )}
            Confirmer
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
