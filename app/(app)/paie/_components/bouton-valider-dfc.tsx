"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { validerDFC } from "@/lib/actions/paie";
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

export function BoutonValiderDFC({ periodeId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleValider() {
    setLoading(true);
    try {
      await validerDFC(periodeId);
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
          Valider (DFC)
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Validation Direction Financière</AlertDialogTitle>
          <AlertDialogDescription>
            En validant, vous confirmez que l'engagement financier est autorisé.
            La période pourra ensuite être clôturée et les exports générés.
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
