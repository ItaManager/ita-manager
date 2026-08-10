"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModaleNouvelleMission } from "./modale-nouvelle-mission";

interface BoutonNouvelleMissionProps {
  employeId: string;
}

export function BoutonNouvelleMission({ employeId }: BoutonNouvelleMissionProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button onClick={() => setOuvert(true)}>
        <Plus className="size-4 mr-2" />
        Nouvelle mission
      </Button>
      <ModaleNouvelleMission
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        employeId={employeId}
      />
    </>
  );
}
