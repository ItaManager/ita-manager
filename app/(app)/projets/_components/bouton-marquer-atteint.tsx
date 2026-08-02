"use client";

import { useState } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { marquerJalonAtteint } from "@/lib/actions/projets";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface BoutonMarquerAtteintProps {
  jalonId: string;
}

export function BoutonMarquerAtteint({ jalonId }: BoutonMarquerAtteintProps) {
  const [ouvert, setOuvert] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMarquerAtteint = async () => {
    setLoading(true);
    try {
      await marquerJalonAtteint(jalonId);
      toast.success("Jalon marqué comme atteint");
      setOuvert(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la validation du jalon"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={ouvert} onOpenChange={setOuvert}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CheckCircle2 className="size-4 mr-2" aria-hidden="true" />
          Marquer atteint
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Marquer ce jalon comme atteint ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action confirme que le jalon a été validé. La date de validation
            sera enregistrée. Cette opération est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleMarquerAtteint} disabled={loading}>
            {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
            Confirmer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
