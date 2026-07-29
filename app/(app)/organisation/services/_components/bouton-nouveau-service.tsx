"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModalService } from "./modal-service";
import type { Direction } from "@prisma/client";

interface BoutonNouveauServiceProps {
  directions: Direction[];
}

export function BoutonNouveauService({ directions }: BoutonNouveauServiceProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button size="sm" className="gap-2" onClick={() => setOuvert(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Nouveau service
      </Button>

      <ModalService
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        directions={directions}
      />
    </>
  );
}
