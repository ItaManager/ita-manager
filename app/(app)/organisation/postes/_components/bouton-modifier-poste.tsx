"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ModalPoste } from "./modal-poste";
import type { Direction, Service, Poste } from "@prisma/client";

interface BoutonModifierPosteProps {
  poste: Poste & { direction: Direction; service: Service | null };
  directions: Direction[];
  services: Service[];
}

export function BoutonModifierPoste({
  poste,
  directions,
  services,
}: BoutonModifierPosteProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOuvert(true)}>
        Modifier
      </Button>

      <ModalPoste
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        directions={directions}
        services={services}
        poste={poste}
      />
    </>
  );
}
