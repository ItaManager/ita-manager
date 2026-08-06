"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ModaleCompetence } from "./modale-competence";

export function BoutonNouvelleCompetence() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button onClick={() => setOuvert(true)} className="gap-2">
        <Plus className="size-4" />
        Nouvelle compétence
      </Button>

      <ModaleCompetence
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        mode="creer"
      />
    </>
  );
}
