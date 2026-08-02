"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { ModalModifierLieu } from "@/app/(app)/ressources/_components/modal-modifier-lieu";
import { desactiverLieu } from "@/lib/actions/lieu";
import type { LieuStockage } from "@prisma/client";

type ActionsLieuProps = {
  lieu: LieuStockage & {
    projet?: { id: string; code: string; nom: string } | null;
  };
  projets: { id: string; code: string; nom: string }[];
};

export function ActionsLieu({ lieu, projets }: ActionsLieuProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalModifierOuverte, setModalModifierOuverte] = useState(false);
  const [dialogDesactiverOuvert, setDialogDesactiverOuvert] = useState(false);
  const [erreurDesactivation, setErreurDesactivation] = useState<string | null>(
    null
  );

  const handleDesactiver = async () => {
    setErreurDesactivation(null);

    try {
      const resultat = await desactiverLieu(lieu.id);

      if (!resultat.success) {
        setErreurDesactivation("Impossible de désactiver ce lieu");
        return;
      }

      setDialogDesactiverOuvert(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErreurDesactivation(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setModalModifierOuverte(true)}
          disabled={!lieu.actif}
        >
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
        {lieu.actif && (
          <Button
            variant="destructive"
            onClick={() => setDialogDesactiverOuvert(true)}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Désactiver
          </Button>
        )}
      </div>

      {/* Modal de modification */}
      <ModalModifierLieu
        ouvert={modalModifierOuverte}
        onFermer={() => setModalModifierOuverte(false)}
        lieu={lieu}
        projets={projets}
      />

      {/* Dialog de confirmation désactivation */}
      <AlertDialog
        open={dialogDesactiverOuvert}
        onOpenChange={setDialogDesactiverOuvert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver ce lieu ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le lieu "{lieu.libelle}" sera désactivé et ne pourra plus être
              utilisé pour de nouveaux mouvements de stock. Les données
              historiques seront conservées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {erreurDesactivation && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {erreurDesactivation}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDesactiver();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
