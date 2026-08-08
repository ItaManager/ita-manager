"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { ModaleJournalier } from "./modale-journalier";

interface BoutonAjouterJournalierProps {
  directions: Array<{ id: string; libelle: string }>;
  services: Array<{ id: string; libelle: string; directionId: string }>;
  projets: Array<{ id: string; code: string; nom: string }>;
}

export function BoutonAjouterJournalier({
  directions,
  services,
  projets,
}: BoutonAjouterJournalierProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOuvert(true)}
        variant="outline"
        className="gap-2 h-9 px-4 text-sm rounded-full transition-all"
      >
        <UserPlus className="size-4" />
        Créer un journalier
      </Button>

      <ModaleJournalier
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        directions={directions}
        services={services}
        projets={projets}
      />
    </>
  );
}
