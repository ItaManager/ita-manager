"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModalNouvelleReception } from "./modal-nouvelle-reception";

interface BoutonNouvelleReceptionProps {
  articles: {
    id: string;
    reference: string;
    designation: string;
    unite: string;
  }[];
}

export function BoutonNouvelleReception({
  articles,
}: BoutonNouvelleReceptionProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button onClick={() => setOuvert(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Nouvelle réception
      </Button>

      <ModalNouvelleReception
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        articles={articles}
      />
    </>
  );
}
