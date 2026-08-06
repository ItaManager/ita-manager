"use client";

import { useState } from "react";
import { FileEdit } from "lucide-react";
import { ModaleCreationEmployeV2 } from "./modale-creation-employe-v2";

interface BoutonModifierEmployeProps {
  employeId: string;
  postes: Array<{ id: string; libelle: string; code: string; serviceId?: string | null; directionId: string }>;
  nationalites: Array<{ id: string; libelle: string }>;
  directions: Array<{ id: string; libelle: string }>;
  services: Array<{ id: string; libelle: string; directionId: string }>;
}

export function BoutonModifierEmploye({
  employeId,
  postes,
  nationalites,
  directions,
  services,
}: BoutonModifierEmployeProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <button
        onClick={() => setOuvert(true)}
        className="p-2 hover:bg-muted rounded-lg transition-colors"
        title="Modifier l'employé"
      >
        <FileEdit className="size-4 text-muted-foreground" />
      </button>

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
