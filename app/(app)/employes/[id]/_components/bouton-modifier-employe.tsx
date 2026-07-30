"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { ModaleModificationEmploye } from "./modale-modification-employe";
import type { TypeMainOeuvre } from "@prisma/client";

interface BoutonModifierEmployeProps {
  employeId: string;
  typeMainOeuvre: TypeMainOeuvre;
  disabled?: boolean;
}

export function BoutonModifierEmploye({
  employeId,
  typeMainOeuvre,
  disabled,
}: BoutonModifierEmployeProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOuvert(true)}
        disabled={disabled}
        className="gap-2"
      >
        <Pencil className="size-4" />
        Modifier
      </Button>

      <ModaleModificationEmploye
        employeId={employeId}
        typeMainOeuvre={typeMainOeuvre}
        ouvert={ouvert}
        onOuvertChange={setOuvert}
      />
    </>
  );
}
