"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormulairePrix } from "./formulaire-prix";

interface ModaleAjoutPrixProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModaleAjoutPrix({ open, onOpenChange }: ModaleAjoutPrixProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter un prix fournisseur</DialogTitle>
          <DialogDescription>
            Enregistrez un nouveau prix pour un article et un fournisseur spécifiques.
          </DialogDescription>
        </DialogHeader>
        <FormulairePrix onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
