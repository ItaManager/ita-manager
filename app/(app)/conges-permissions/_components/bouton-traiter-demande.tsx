"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

interface BoutonTraiterDemandeProps {
  employeId: string;
  nom: string;
  prenom: string;
}

export function BoutonTraiterDemande({
  employeId,
  nom,
  prenom,
}: BoutonTraiterDemandeProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOuvert(true)}
        size="sm"
        className="h-7 px-3 text-xs bg-[#13850b] hover:bg-[#0f6909] text-white rounded-full"
      >
        À traiter
      </Button>

      {/* TODO: Modale de détail des demandes */}
      {ouvert && (
        <div>Modale pour {nom} {prenom}</div>
      )}
    </>
  );
}
