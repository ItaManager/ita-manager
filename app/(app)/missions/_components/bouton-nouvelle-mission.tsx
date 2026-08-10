"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus } from "lucide-react";
import { ModaleNouvelleMission } from "./modale-nouvelle-mission";

interface BoutonNouvelleMissionProps {
  employeId: string;
  bloque?: boolean;
  raisonBlocage?: string;
}

export function BoutonNouvelleMission({ employeId, bloque, raisonBlocage }: BoutonNouvelleMissionProps) {
  const [ouvert, setOuvert] = useState(false);

  const bouton = (
    <Button onClick={() => setOuvert(true)} disabled={bloque}>
      <Plus className="size-4 mr-2" />
      Nouvelle mission
    </Button>
  );

  return (
    <>
      {bloque && raisonBlocage ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{bouton}</TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{raisonBlocage}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        bouton
      )}
      <ModaleNouvelleMission
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        employeId={employeId}
      />
    </>
  );
}
