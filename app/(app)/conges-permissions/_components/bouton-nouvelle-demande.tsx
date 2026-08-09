"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModaleNouvelleDemande } from "./modale-nouvelle-demande";

export function BoutonNouvelleDemande() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button onClick={() => setOuvert(true)} className="gap-2">
        <Plus className="size-4" />
        Nouvelle demande
      </Button>

      <ModaleNouvelleDemande ouvert={ouvert} onFermer={() => setOuvert(false)} />
    </>
  );
}
