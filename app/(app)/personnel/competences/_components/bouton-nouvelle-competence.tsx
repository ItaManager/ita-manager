"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ModaleCompetence } from "./modale-competence";

export function BoutonNouvelleCompetence() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOuvert(true)}
        className="gap-2 h-9 px-4 text-sm rounded-full bg-primary hover:bg-primary-hover text-primary-foreground transition-all cursor-pointer shadow-sm hover:shadow-md"
      >
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
