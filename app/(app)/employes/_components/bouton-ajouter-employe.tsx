"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModaleCreationEmployeV2 } from "./modale-creation-employe-v2";

interface BoutonAjouterEmployeProps {
  postes: Array<{ id: string; libelle: string; code: string; serviceId: string | null; directionId: string }>;
  nationalites: Array<{ id: string; libelle: string }>;
  directions: Array<{ id: string; libelle: string }>;
  services: Array<{ id: string; libelle: string; directionId: string }>;
  employes: Array<{ id: string; matricule: string; nom: string; prenom: string }>;
  projets: Array<{ id: string; code: string; nom: string }>;
}

export function BoutonAjouterEmploye({
  postes,
  nationalites,
  directions,
  services,
  employes,
  projets,
}: BoutonAjouterEmployeProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        className="gap-2 h-9 px-4 text-sm rounded-full bg-primary hover:bg-primary-hover text-primary-foreground transition-all cursor-pointer shadow-sm hover:shadow-md"
      >
        <Plus className="size-4" />
        Ajouter un employé
      </Button>

      <ModaleCreationEmployeV2
        ouvert={modalOpen}
        onFermer={() => setModalOpen(false)}
        postes={postes}
        nationalites={nationalites}
        directions={directions}
        services={services}
      />
    </>
  );
}
