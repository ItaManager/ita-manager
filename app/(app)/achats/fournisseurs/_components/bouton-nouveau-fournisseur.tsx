"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModaleFournisseur } from "./modale-fournisseur";

export function BoutonNouveauFournisseur() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button size="sm" className="gap-2" onClick={() => setOuvert(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Nouveau fournisseur
      </Button>

      <ModaleFournisseur
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
      />
    </>
  );
}
