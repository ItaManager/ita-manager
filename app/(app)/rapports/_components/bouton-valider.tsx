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
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface BoutonValiderProps {
  rapportId: string;
  disabled?: boolean;
}

/**
 * Approve activity report (conducteur de travaux only)
 * M6 — Rapports d'activité
 *
 * Permission: releve:viser
 */
export function BoutonValider({ rapportId, disabled }: BoutonValiderProps) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const handleValider = () => {
    setErreur(null);

    startTransition(async () => {
      try {
        // TODO: Call Server Action to validate report
        // await validerRapport(rapportId);

        setOuvert(false);
        router.refresh();
      } catch (error) {
        console.error("[BoutonValider] Error:", error);
        setErreur(
          error instanceof Error ? error.message : "Erreur lors de la validation"
        );
      }
    });
  };

  return (
    <>
      <Button
        size="sm"
        variant="default"
        className="gap-2"
        onClick={() => setOuvert(true)}
        disabled={disabled || isPending}
      >
        <CheckCircle className="size-4" aria-hidden="true" />
        Valider
      </Button>

      <AlertDialog open={ouvert} onOpenChange={setOuvert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valider le relevé ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le relevé sera approuvé et les heures seront comptabilisées pour la paie.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {erreur && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{erreur}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleValider} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
