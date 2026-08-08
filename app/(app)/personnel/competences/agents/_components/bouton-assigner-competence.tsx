"use client";

import { Button } from "@/components/ui/button";
import { UserPlus, Pencil } from "lucide-react";
import { useState } from "react";
import { ModaleAssignerCompetence } from "./modale-assigner-competence";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setOuvert(true)}
            size="sm"
            variant={aDejaCompetence ? "ghost" : undefined}
            className={
              aDejaCompetence
                ? "h-8 w-8 p-0"
                : "h-7 px-3 text-xs bg-[#13850b] hover:bg-[#0f6909] text-white rounded-full"
            }
          >
            {aDejaCompetence ? (
              <>
                <Pencil className="size-3.5" />
                <span className="sr-only">Modifier la compétence</span>
              </>
            ) : (
              "Assigner"
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">
            {aDejaCompetence
              ? "Changer la compétence de cet agent"
              : "Assigner une compétence à cet agent. Sans compétence, l'agent ne peut pas être pointé au relevé d'activité."}
          </p>
        </TooltipContent>
      </Tooltip>

      <ModaleAssignerCompetence
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        agent={agent}
      />
    </TooltipProvider>
  );
}
