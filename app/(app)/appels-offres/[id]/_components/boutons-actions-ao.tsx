"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, FileCheck2, SendHorizontal } from "lucide-react";
import { ModaleGoNoGo } from "./modale-go-no-go";
import { ModaleConstitution } from "./modale-constitution";
import { ModaleSoumission } from "./modale-soumission";
import { ModaleResultat } from "./modale-resultat";

type Props = {
  appelOffresId: string;
  statut: string;
};

export function BoutonsActionsAO({ appelOffresId, statut }: Props) {
  const [modaleGoNoGo, setModaleGoNoGo] = useState(false);
  const [modaleConstitution, setModaleConstitution] = useState(false);
  const [modaleSoumission, setModaleSoumission] = useState(false);
  const [modaleResultat, setModaleResultat] = useState(false);

  if (statut === "VEILLE") {
    return (
      <>
        <Button
          onClick={() => setModaleGoNoGo(true)}
          className="rounded-full"
        >
          <CheckCircle2 className="size-4" />
          Décider Go/No-go
        </Button>
        <ModaleGoNoGo
          appelOffresId={appelOffresId}
          ouvert={modaleGoNoGo}
          onOuvertChange={setModaleGoNoGo}
        />
      </>
    );
  }

  if (statut === "GO") {
    return (
      <>
        <Button
          onClick={() => setModaleConstitution(true)}
          className="rounded-full"
        >
          <FileCheck2 className="size-4" />
          Passer en constitution
        </Button>
        <ModaleConstitution
          appelOffresId={appelOffresId}
          ouvert={modaleConstitution}
          onOuvertChange={setModaleConstitution}
        />
      </>
    );
  }

  if (statut === "CONSTITUTION") {
    return (
      <>
        <Button
          onClick={() => setModaleSoumission(true)}
          className="rounded-full bg-success text-success-foreground hover:bg-success/90"
        >
          <SendHorizontal className="size-4" />
          Marquer comme soumis
        </Button>
        <ModaleSoumission
          appelOffresId={appelOffresId}
          ouvert={modaleSoumission}
          onOuvertChange={setModaleSoumission}
        />
      </>
    );
  }

  if (statut === "SOUMIS") {
    return (
      <>
        <Button
          onClick={() => setModaleResultat(true)}
          className="rounded-full"
        >
          Enregistrer le résultat
        </Button>
        <ModaleResultat
          appelOffresId={appelOffresId}
          ouvert={modaleResultat}
          onOuvertChange={setModaleResultat}
        />
      </>
    );
  }

  return null;
}
