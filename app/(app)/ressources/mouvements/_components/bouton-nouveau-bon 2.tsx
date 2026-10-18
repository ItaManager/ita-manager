"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModalNouveauBon } from "./modal-nouveau-bon";

type LieuOption = {
  id: string;
  libelle: string;
  nature: string;
};

type ArticleOption = {
  id: string;
  reference: string;
  designation: string;
  unite: string;
};

type BoutonNouveauBonProps = {
  lieux: LieuOption[];
  articles: ArticleOption[];
};

export function BoutonNouveauBon({ lieux, articles }: BoutonNouveauBonProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button onClick={() => setOuvert(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Nouveau bon
      </Button>
      <ModalNouveauBon
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        lieux={lieux}
        articles={articles}
      />
    </>
  );
}
