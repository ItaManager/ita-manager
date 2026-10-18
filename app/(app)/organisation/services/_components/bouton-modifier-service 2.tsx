"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ModalService } from "./modal-service";
import type { Direction, Service } from "@prisma/client";

interface BoutonModifierServiceProps {
  service: Service & { direction: Direction };
  directions: Direction[];
}

export function BoutonModifierService({
  service,
  directions,
}: BoutonModifierServiceProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOuvert(true)}>
        Modifier
      </Button>

      <ModalService
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        directions={directions}
        service={service}
      />
    </>
  );
}
