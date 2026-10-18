"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { validerDemandeN1 } from "@/lib/actions/ressources";
import { useToast } from "@/hooks/use-toast";

type BoutonValiderN1Props = {
  demandeId: string;
};

export function BoutonValiderN1({ demandeId }: BoutonValiderN1Props) {
  const [enCours, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function handleValider() {
    startTransition(async () => {
      try {
        await validerDemandeN1(demandeId);

        toast({
          title: "Demande validée",
          description:
            "La demande a été validée et transmise au service compétent.",
        });

        router.refresh();
      } catch (error) {
        toast({
          title: "Erreur",
          description:
            error instanceof Error
              ? error.message
              : "Impossible de valider la demande",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={enCours} aria-label="Valider en tant que N+1">
          <CheckCircle className="mr-2 size-4" aria-hidden="true" />
          Valider (N+1)
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Valider la demande (N+1)</AlertDialogTitle>
          <AlertDialogDescription>
            En validant cette demande en tant que supérieur hiérarchique, vous
            confirmez la pertinence de la demande et la transmettez au service
            compétent (RH pour les ressources humaines, Logistique pour les
            ressources matérielles) pour arbitrage final.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={enCours}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleValider} disabled={enCours}>
            {enCours ? "Validation..." : "Valider et transmettre"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
