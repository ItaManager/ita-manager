"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModaleNouvelEmploye } from "./modale-nouvel-employe";

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
        className="gap-2 h-12 px-6 text-base bg-primary hover:bg-primary-hover shadow-md hover:shadow-lg transition-all cursor-pointer"
      >
        <Plus className="size-5" />
        Ajouter un employé
      </Button>

      <ModaleNouvelEmploye
        open={modalOpen}
        onOpenChange={setModalOpen}
        postes={postes}
        nationalites={nationalites}
        directions={directions}
        services={services}
        employes={employes}
        projets={projets}
      />
    </>
  );
}
