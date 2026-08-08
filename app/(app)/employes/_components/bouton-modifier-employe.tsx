"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { ModaleModificationEmploye } from "./modale-modification-employe";

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
        <Pencil className="size-4 text-muted-foreground" />
      </button>

      <ModaleModificationEmploye
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        employeId={employeId}
        nationalites={nationalites}
      />
    </>
  );
}
