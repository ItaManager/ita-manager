"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { ModaleCreationEmployeV2 } from "../../_components/modale-creation-employe-v2";

interface BoutonModifierEmployeProps {
  employeId: string;
  postes: Array<{ id: string; libelle: string; code: string; serviceId?: string | null; directionId: string }>;
  nationalites: Array<{ id: string; libelle: string }>;
  directions: Array<{ id: string; libelle: string }>;
  services: Array<{ id: string; libelle: string; directionId: string }>;
  disabled?: boolean;
}

export function BoutonModifierEmploye({
  employeId,
  postes,
  nationalites,
  directions,
  services,
  disabled,
}: BoutonModifierEmployeProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOuvert(true)}
        disabled={disabled}
        className="gap-2"
      >
        <Pencil className="size-4" />
        Modifier
      </Button>

      <ModaleCreationEmployeV2
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        postes={postes}
        nationalites={nationalites}
        directions={directions}
        services={services}
        employeId={employeId}
      />
    </>
  );
}
