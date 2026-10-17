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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, UserX, UserCheck } from "lucide-react";
import { desactiverUtilisateur, reactiverUtilisateur } from "@/lib/actions/utilisateurs";
import type { Profil } from "@prisma/client";

interface BoutonActivationProps {
  utilisateurId: string;
  email: string;
  actif: boolean;
}

export function BoutonActivation({ utilisateurId, email, actif }: BoutonActivationProps) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const handleAction = async () => {
    setErreur(null);

    try {
      if (actif) {
        await desactiverUtilisateur(utilisateurId);
      } else {
        await reactiverUtilisateur(utilisateurId);
      }

      setOuvert(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErreur(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    }
  };

  return (
    <>
      <button
        className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-sm cursor-pointer flex items-center gap-2"
        onClick={() => setOuvert(true)}
      >
        {actif ? (
          <>
            <UserX className="size-4" aria-hidden="true" />
            Désactiver
          </>
        ) : (
          <>
            <UserCheck className="size-4" aria-hidden="true" />
            Réactiver
          </>
        )}
      </button>

      <AlertDialog open={ouvert} onOpenChange={setOuvert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actif ? "Désactiver" : "Réactiver"} le compte ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actif ? (
                <>
                  L'utilisateur <strong>{email}</strong> ne pourra
                  plus se connecter jusqu'à ce que son compte soit réactivé.
                </>
              ) : (
                <>
                  L'utilisateur <strong>{email}</strong> pourra à
                  nouveau se connecter.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {erreur && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertDescription>{erreur}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={isPending}>
              {isPending && (
                <Loader2
                  className="mr-2 size-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {actif ? "Désactiver" : "Réactiver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
