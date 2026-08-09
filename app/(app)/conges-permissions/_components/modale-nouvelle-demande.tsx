"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ModaleNouvelleDemandeProps {
  ouvert: boolean;
  onFermer: () => void;
}

export function ModaleNouvelleDemande({ ouvert, onFermer }: ModaleNouvelleDemandeProps) {
  return (
    <Dialog open={ouvert} onOpenChange={onFermer}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            Nouvelle demande de congé
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Créez une nouvelle demande de congé ou de permission
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            Formulaire à implémenter
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
