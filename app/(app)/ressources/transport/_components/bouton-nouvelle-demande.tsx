"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function BoutonNouvelleDemande() {
  return (
    <Button disabled>
      <Plus className="h-4 w-4 mr-2" />
      Nouvelle demande
    </Button>
  );
}
