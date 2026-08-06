"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModaleNouveauContrat } from "./modale-nouveau-contrat";

interface BoutonNouveauContratProps {
  employes: Array<{ id: string; matricule: string; nom: string; prenom: string }>;
}

export function BoutonNouveauContrat({ employes }: BoutonNouveauContratProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOuvert(true)}
        className="gap-2 h-12 px-6 text-base shadow-sm hover:shadow-md"
      >
        <Plus className="size-5" />
        Nouveau contrat
      </Button>

      <ModaleNouveauContrat
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        employes={employes}
      />
    </>
  );
}
