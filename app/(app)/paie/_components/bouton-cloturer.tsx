"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cloturerPeriode } from "@/lib/actions/paie";
import { Loader2, Lock } from "lucide-react";
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

export function BoutonCloturer({ periodeId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCloturer() {
    setLoading(true);
    try {
      await cloturerPeriode(periodeId);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Erreur lors de la clôture");
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
            <Lock className="size-4" />
          )}
          Clôturer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clôturer la période ?</AlertDialogTitle>
          <AlertDialogDescription>
            La clôture rend la période immuable. Aucune modification ne sera plus possible.
            Assurez-vous que les exports ont bien été générés avant de clôturer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCloturer}
            disabled={loading}
            className="rounded-full"
          >
            {loading && <Loader2 className="size-4 animate-spin mr-2" />}
            Confirmer la clôture
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
