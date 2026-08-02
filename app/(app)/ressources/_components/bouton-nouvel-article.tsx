"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModalNouvelArticle } from "./modal-nouvel-article";

export function BoutonNouvelArticle() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button onClick={() => setOuvert(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Nouvel article
      </Button>

      <ModalNouvelArticle
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
      />
    </>
  );
}
