"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { validerDT } from "@/lib/actions/paie";
import { Loader2, CheckCircle } from "lucide-react";
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

type Props = {
  periodeId: string;
};

export function BoutonValiderDT({ periodeId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleValider() {
    setLoading(true);
    try {
      await validerDT(periodeId);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Erreur lors de la validation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default" disabled={loading} className="rounded-full">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle className="size-4" />
          )}
          Valider (DT)
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Validation Direction Technique</AlertDialogTitle>
          <AlertDialogDescription>
            En validant, vous confirmez que les heures déclarées correspondent à l'avancement du chantier.
            La période passera ensuite à la validation de la Direction Financière.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleValider}
            disabled={loading}
            className="rounded-full"
          >
            {loading && <Loader2 className="size-4 animate-spin mr-2" />}
            Confirmer la validation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
