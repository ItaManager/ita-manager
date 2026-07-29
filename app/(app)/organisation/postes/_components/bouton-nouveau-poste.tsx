"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModalPoste } from "./modal-poste";
import type { Direction, Service } from "@prisma/client";

interface BoutonNouveauPosteProps {
  directions: Direction[];
  services: Service[];
}

export function BoutonNouveauPoste({
  directions,
  services,
}: BoutonNouveauPosteProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button size="sm" className="gap-2" onClick={() => setOuvert(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Nouveau poste
      </Button>

      <ModalPoste
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        directions={directions}
        services={services}
      />
    </>
  );
}
