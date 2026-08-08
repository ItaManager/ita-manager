"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { archiverEmploye } from "@/lib/actions/employes";

interface ModaleArchiverJournalierProps {
  ouvert: boolean;
  onClose: () => void;
  employeId: string;
  employeNom: string;
  employePrenom: string;
}

export function ModaleArchiverJournalier({
  ouvert,
  onClose,
  employeId,
  employeNom,
  employePrenom,
}: ModaleArchiverJournalierProps) {
  const router = useRouter();
  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleArchiver = async () => {
    setErreur(null);

    if (!motif || motif.trim().length < 10) {
      setErreur("Le motif d'archivage doit contenir au moins 10 caractères.");
      return;
    }

    setIsSubmitting(true);
    try {
      await archiverEmploye(employeId, motif.trim());

      // Succès
      setMotif("");
      onClose();
      router.refresh();
    } catch (error) {
      setErreur(
        error instanceof Error ? error.message : "Une erreur est survenue lors de l'archivage"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMotif("");
      setErreur(null);
      onClose();
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader
          className="border-b border-border px-6 py-4"
          style={{ backgroundColor: "#fef2f2" }}
        >
          <DialogTitle className="text-xl font-semibold text-destructive">
            Archiver le journalier
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {employeNom} {employePrenom}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          {erreur && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertDescription>{erreur}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                L'archivage va clôturer toutes les affectations en cours et masquer
                ce journalier des listes actives. Cette action est réversible.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motif" className="text-sm font-medium">
                Motif de l'archivage <span className="text-destructive">*</span>
              </Label>
              <Input
                id="motif"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Ex: Fin de contrat, démission, licenciement..."
                className="h-10 rounded-md"
                disabled={isSubmitting}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 caractères ({motif.length}/200)
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-end gap-3">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={isSubmitting}
            className="rounded-full px-6"
          >
            Annuler
          </Button>
          <Button
            onClick={handleArchiver}
            disabled={isSubmitting || motif.trim().length < 10}
            variant="destructive"
            className="rounded-full px-6"
          >
            {isSubmitting && (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            )}
            Archiver
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
