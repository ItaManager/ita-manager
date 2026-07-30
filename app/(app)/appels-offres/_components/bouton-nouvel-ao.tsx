"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModaleNouvelAO } from "./modale-nouvel-ao";

export function BoutonNouvelAO() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button onClick={() => setOuvert(true)} className="rounded-full">
        <Plus className="size-4" />
        Nouvel appel d'offres
      </Button>

      <ModaleNouvelAO ouvert={ouvert} onOuvertChange={setOuvert} />
    </>
  );
}
