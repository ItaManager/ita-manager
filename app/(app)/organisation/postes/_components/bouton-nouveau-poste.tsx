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
      <Button
        onClick={() => setOuvert(true)}
        className="gap-2 h-12 px-6 text-base bg-primary hover:bg-primary-hover shadow-md hover:shadow-lg transition-all cursor-pointer"
      >
        <Plus className="size-5" />
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
