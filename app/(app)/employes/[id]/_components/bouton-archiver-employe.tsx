"use client";

import { useState, useTransition } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Archive, Loader2 } from "lucide-react";
import { archiverEmploye } from "@/lib/actions/employes";
import { toastSucces, toastErreur } from "@/lib/utils/toast";
import { useRouter } from "next/navigation";

interface BoutonArchiverEmployeProps {
  employeId: string;
  nom: string;
  prenom: string;
  matricule: string;
}

export function BoutonArchiverEmploye({
  employeId,
  nom,
  prenom,
  matricule,
}: BoutonArchiverEmployeProps) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleArchiver = () => {
    if (motif.trim().length < 10) {
      toastErreur(
        "Motif requis",
        "Le motif d'archivage doit contenir au moins 10 caractères."
      );
      return;
    }

    startTransition(async () => {
      try {
        await archiverEmploye(employeId, motif);
        toastSucces(
          "Employé archivé",
          `${nom} ${prenom} (${matricule}) a été archivé.`
        );
        setOuvert(false);
        router.push("/employes");
      } catch (error: any) {
        toastErreur("Échec de l'archivage", error.message);
      }
    });
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOuvert(true)}
        className="gap-2"
      >
        <Archive className="size-4" />
        Archiver
      </Button>

      <AlertDialog open={ouvert} onOpenChange={setOuvert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver cet employé</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va clôturer toutes les affectations actives et
              désactiver le compte applicatif de{" "}
              <strong>
                {nom} {prenom}
              </strong>{" "}
              ({matricule}).
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="motif">
              Motif de l'archivage <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex: Démission, Licenciement, Fin de contrat, Décès..."
              className="min-h-[100px]"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 caractères. Ce motif sera journalisé.
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleArchiver();
              }}
              disabled={isPending || motif.trim().length < 10}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Archivage...
                </>
              ) : (
                <>
                  <Archive className="size-4 mr-2" />
                  Archiver définitivement
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
