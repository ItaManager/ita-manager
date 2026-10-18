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
import { Send } from "lucide-react";
import { soumettreDemandeRessource } from "@/lib/actions/ressources";
import { useToast } from "@/hooks/use-toast";

type BoutonSoumettreProps = {
  demandeId: string;
};

export function BoutonSoumettre({ demandeId }: BoutonSoumettreProps) {
  const [enCours, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function handleSoumettre() {
    startTransition(async () => {
      try {
        await soumettreDemandeRessource(demandeId);

        toast({
          title: "Demande soumise",
          description:
            "La demande a été soumise pour validation à votre N+1.",
        });

        router.refresh();
      } catch (error) {
        toast({
          title: "Erreur",
          description:
            error instanceof Error
              ? error.message
              : "Impossible de soumettre la demande",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={enCours} aria-label="Soumettre la demande">
          <Send className="mr-2 size-4" aria-hidden="true" />
          Soumettre
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Soumettre la demande</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action enverra la demande de ressource à votre supérieur
            hiérarchique (N+1) pour validation. Une fois soumise, vous ne
            pourrez plus modifier la demande.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={enCours}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleSoumettre} disabled={enCours}>
            {enCours ? "Envoi..." : "Soumettre pour validation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
