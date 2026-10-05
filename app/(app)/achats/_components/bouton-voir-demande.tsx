"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { ModaleDetailDemande } from "./modale-detail-demande";

interface BoutonVoirDemandeProps {
  ref: string;
}

export function BoutonVoirDemande({ ref }: BoutonVoirDemandeProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => setOuvert(true)}
      >
        <Eye className="size-4" />
        <span className="sr-only">Voir détails</span>
      </Button>

      <ModaleDetailDemande
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        ref={ref}
      />
    </>
  );
}
