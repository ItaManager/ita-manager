"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModalNouvelleInspection } from "./modal-nouvelle-inspection";
import type { Materiel, LieuStockage, PointInspection } from "@prisma/client";

interface BoutonNouvelleInspectionProps {
  materiels: Pick<Materiel, "id" | "codeIta" | "designation">[];
  lieux: Pick<LieuStockage, "id" | "libelle">[];
  pointsInspection: PointInspection[];
}

export function BoutonNouvelleInspection({
  materiels,
  lieux,
  pointsInspection,
}: BoutonNouvelleInspectionProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button onClick={() => setOuvert(true)}>
        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
        Nouvelle inspection
      </Button>

      <ModalNouvelleInspection
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        materiels={materiels}
        lieux={lieux}
        pointsInspection={pointsInspection}
      />
    </>
  );
}
