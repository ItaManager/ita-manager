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
      <Button
        onClick={() => setOuvert(true)}
        className="gap-2 h-12 px-6 text-base bg-primary hover:bg-primary-hover shadow-md hover:shadow-lg transition-all cursor-pointer"
      >
        <Plus className="size-5" />
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
