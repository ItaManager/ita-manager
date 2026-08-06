"use client";

import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { ModaleCompetence } from "./modale-competence";
import type { CompetenceListItem } from "@/lib/actions/competences";

interface BoutonModifierCompetenceProps {
  competence: CompetenceListItem;
}

export function BoutonModifierCompetence({
  competence,
}: BoutonModifierCompetenceProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOuvert(true)}
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
      >
        <Pencil className="size-3.5" />
        <span className="sr-only">Modifier la compétence</span>
      </Button>

      <ModaleCompetence
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        mode="modifier"
        competence={competence}
      />
    </>
  );
}
