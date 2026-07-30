"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { ModaleCreationEmployeV2 } from "./modale-creation-employe-v2";

interface BoutonNouvelEmployeProps {
  postes: Array<{
    id: string;
    libelle: string;
    code: string;
    serviceId?: string | null;
    directionId: string;
  }>;
  nationalites: Array<{ id: string; libelle: string }>;
  directions: Array<{ id: string; libelle: string }>;
  services: Array<{ id: string; libelle: string; directionId: string }>;
}

export function BoutonNouvelEmploye({
  postes,
  nationalites,
  directions,
  services,
}: BoutonNouvelEmployeProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button onClick={() => setOuvert(true)}>
        <UserPlus className="size-4 mr-2" aria-hidden="true" />
        Nouvel employé
      </Button>

      <ModaleCreationEmployeV2
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        postes={postes}
        nationalites={nationalites}
        directions={directions}
        services={services}
      />
    </>
  );
}
