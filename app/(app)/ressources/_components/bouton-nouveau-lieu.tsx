"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModalNouveauLieu } from "./modal-nouveau-lieu";

type BoutonNouveauLieuProps = {
  projets: { id: string; code: string; nom: string }[];
};

export function BoutonNouveauLieu({ projets }: BoutonNouveauLieuProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button onClick={() => setOuvert(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Nouveau lieu
      </Button>

      <ModalNouveauLieu
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        projets={projets}
      />
    </>
  );
}
