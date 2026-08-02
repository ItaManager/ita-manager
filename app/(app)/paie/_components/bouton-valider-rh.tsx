"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { validerRH } from "@/lib/actions/paie";
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

export function BoutonValiderRH({ periodeId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleValider() {
    setLoading(true);
    try {
      await validerRH(periodeId);
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
          Valider (RH)
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Validation RH</AlertDialogTitle>
          <AlertDialogDescription>
            En validant, vous confirmez avoir vérifié les pointages et les anomalies.
            La période passera ensuite à la validation de la Direction Technique.
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
