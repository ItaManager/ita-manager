"use client";

import { useState } from "react";
import { ListePrix } from "./liste-prix";
import { ModaleAjoutPrix } from "./modale-ajout-prix";

interface Prix {
  id: string;
  prixHT: number;
  article: {
    designation: string;
    unite: {
      libelle: string;
    };
  };
  fournisseur: {
    nom: string;
  };
}

interface BordereauWrapperProps {
  prix: Prix[];
}

export function BordereauWrapper({ prix }: BordereauWrapperProps) {
  const [modaleOuverte, setModaleOuverte] = useState(false);

  return (
    <>
      <ListePrix prix={prix} onAjouterClick={() => setModaleOuverte(true)} />
      <ModaleAjoutPrix
        open={modaleOuverte}
        onOpenChange={setModaleOuverte}
      />
    </>
  );
}
