"use client";

import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { useState } from "react";
import { ModaleTaux } from "./modale-taux";
import type { CompetenceListItem } from "@/lib/actions/competences";

interface BoutonReviserTauxProps {
  competence: CompetenceListItem;
}

export function BoutonReviserTaux({ competence }: BoutonReviserTauxProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOuvert(true)}
        size="sm"
        className="h-7 px-3 text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full"
      >
        Réviser
      </Button>

      <ModaleTaux
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        competence={competence}
        mode="reviser"
      />
    </>
  );
}
