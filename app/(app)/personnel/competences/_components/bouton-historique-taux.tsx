"use client";

import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useState } from "react";
import { ModalHistoriqueTaux } from "./modal-historique-taux";
import type { CompetenceListItem } from "@/lib/actions/competences";

interface BoutonHistoriqueTauxProps {
  competence: CompetenceListItem;
}

export function BoutonHistoriqueTaux({ competence }: BoutonHistoriqueTauxProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOuvert(true)}
        size="sm"
        className="h-7 gap-1 text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full px-3"
      >
        <Eye className="size-3" />
        {competence.nombreVersionsTaux}
      </Button>

      <ModalHistoriqueTaux
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        competence={competence}
      />
    </>
  );
}
