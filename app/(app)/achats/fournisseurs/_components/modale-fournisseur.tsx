"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormulaireFournisseur } from "./formulaire-fournisseur";

interface ModaleFournisseurProps {
  ouvert: boolean;
  onFermer: () => void;
  fournisseur?: {
    id: string;
    nom: string;
    numeroWave: string | null;
  };
}

export function ModaleFournisseur({
  ouvert,
  onFermer,
  fournisseur,
}: ModaleFournisseurProps) {
  return (
    <Dialog open={ouvert} onOpenChange={onFermer}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {fournisseur ? "Modifier fournisseur" : "Nouveau fournisseur"}
          </DialogTitle>
        </DialogHeader>

        <FormulaireFournisseur
          fournisseur={fournisseur}
          onSuccess={onFermer}
        />
      </DialogContent>
    </Dialog>
  );
}
