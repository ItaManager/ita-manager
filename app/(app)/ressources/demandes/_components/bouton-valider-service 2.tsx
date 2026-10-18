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
import { CheckCircle2 } from "lucide-react";
import { validerDemandeService } from "@/lib/actions/ressources";
import { useToast } from "@/hooks/use-toast";

type BoutonValiderServiceProps = {
  demandeId: string;
};

export function BoutonValiderService({
  demandeId,
}: BoutonValiderServiceProps) {
  const [enCours, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function handleValider() {
    startTransition(async () => {
      try {
        await validerDemandeService(demandeId);

        toast({
          title: "Demande validée",
          description:
            "La demande a été validée par le service compétent et peut maintenant être affectée.",
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
        <Button disabled={enCours} aria-label="Valider et arbitrer">
          <CheckCircle2 className="mr-2 size-4" aria-hidden="true" />
          Valider (Service)
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Valider et arbitrer (Service)</AlertDialogTitle>
          <AlertDialogDescription>
            En validant cette demande en tant que service compétent (RH ou
            Logistique), vous confirmez la faisabilité de la demande et
            autorisez son affectation. Pour les ressources matérielles, la
            disponibilité sera vérifiée automatiquement.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={enCours}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleValider} disabled={enCours}>
            {enCours ? "Validation..." : "Valider et autoriser"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
