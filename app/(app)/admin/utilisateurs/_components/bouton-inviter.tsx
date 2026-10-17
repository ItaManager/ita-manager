"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { ModaleInviterUtilisateur } from "./modale-inviter-utilisateur";

interface BoutonInviterProps {
  employesSansCompte: Array<{
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
    poste: {
      libelle: string;
      service: {
        libelle: string;
      };
    } | null;
  }>;
  rolesDisponibles: Array<{
    id: string;
    libelle: string;
    description: string | null;
  }>;
}

export function BoutonInviter({
  employesSansCompte,
  rolesDisponibles,
}: BoutonInviterProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button onClick={() => setOuvert(true)} className="gap-2">
        <UserPlus className="size-4" />
        Inviter un utilisateur
      </Button>

      <ModaleInviterUtilisateur
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        employesSansCompte={employesSansCompte}
        rolesDisponibles={rolesDisponibles}
      />
    </>
  );
}
