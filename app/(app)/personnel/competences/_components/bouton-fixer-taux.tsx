"use client";

import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import { useState } from "react";
import { ModaleTaux } from "./modale-taux";
import type { CompetenceListItem } from "@/lib/actions/competences";

interface BoutonFixerTauxProps {
  competence: CompetenceListItem;
}

export function BoutonFixerTaux({ competence }: BoutonFixerTauxProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOuvert(true)}
        size="sm"
        variant="default"
        className="h-8 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
      >
        <DollarSign className="size-3.5" />
        Fixer le taux
      </Button>

      <ModaleTaux
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        competence={competence}
        mode="fixer"
      />
    </>
  );
}
