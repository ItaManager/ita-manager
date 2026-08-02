"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { calculerPeriode } from "@/lib/actions/paie";
import { Loader2, Calculator } from "lucide-react";
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

export function BoutonCalculer({ periodeId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCalculer() {
    setLoading(true);
    try {
      await calculerPeriode(periodeId);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Erreur lors du calcul");
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
            <Calculator className="size-4" />
          )}
          Calculer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Calculer la période ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le calcul va charger tous les relevés d'activité VISÉS sur la période
            et générer les lignes de paie correspondantes. Cette opération peut prendre
            quelques secondes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCalculer}
            disabled={loading}
            className="rounded-full"
          >
            {loading && <Loader2 className="size-4 animate-spin mr-2" />}
            Confirmer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
