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
import { AlertCircle, Send, Loader2 } from "lucide-react";
import { markForSync } from "@/lib/indexeddb/rapports-db";

interface BoutonSoumettreProps {
  clientId: string;
  disabled?: boolean;
}

/**
 * Submit activity report for approval
 * M6 — Rapports d'activité
 *
 * Marks report as SOUMIS and queues for sync
 */
export function BoutonSoumettre({ clientId, disabled }: BoutonSoumettreProps) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const handleSoumettre = () => {
    setErreur(null);

    startTransition(async () => {
      try {
        // Mark for sync (will be picked up by background sync)
        await markForSync(clientId);

        setOuvert(false);
        router.refresh();
      } catch (error) {
        console.error("[BoutonSoumettre] Error:", error);
        setErreur(
          error instanceof Error ? error.message : "Erreur lors de la soumission"
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
        <Send className="size-4" aria-hidden="true" />
        Soumettre
      </Button>

      <AlertDialog open={ouvert} onOpenChange={setOuvert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Soumettre le relevé ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le relevé sera envoyé au conducteur de travaux pour validation. Vous ne
              pourrez plus le modifier après soumission.
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
            <AlertDialogAction onClick={handleSoumettre} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
