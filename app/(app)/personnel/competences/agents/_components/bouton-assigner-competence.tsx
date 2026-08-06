"use client";

import { Button } from "@/components/ui/button";
import { UserPlus, Pencil } from "lucide-react";
import { useState } from "react";
import { ModaleAssignerCompetence } from "./modale-assigner-competence";

interface AgentItem {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  competence: {
    id: string;
    libelle: string;
    categorie: string;
    dateEffet: Date;
  } | null;
  taux: {
    montant: string;
    dateEffet: Date;
  } | null;
  projet: {
    code: string;
    nom: string;
  } | null;
}

interface BoutonAssignerCompetenceProps {
  agent: AgentItem;
}

export function BoutonAssignerCompetence({
  agent,
}: BoutonAssignerCompetenceProps) {
  const [ouvert, setOuvert] = useState(false);

  const aDejaCompetence = !!agent.competence;

  return (
    <>
      <Button
        onClick={() => setOuvert(true)}
        size="sm"
        variant={aDejaCompetence ? "ghost" : "default"}
        className={aDejaCompetence ? "h-8 w-8 p-0" : "h-8 gap-1.5"}
      >
        {aDejaCompetence ? (
          <>
            <Pencil className="size-3.5" />
            <span className="sr-only">Modifier la compétence</span>
          </>
        ) : (
          <>
            <UserPlus className="size-3.5" />
            Assigner
          </>
        )}
      </Button>

      <ModaleAssignerCompetence
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        agent={agent}
      />
    </>
  );
}
