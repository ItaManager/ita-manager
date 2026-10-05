"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export function BoutonNouvelleDemande() {
  return (
    <Button asChild>
      <Link href="/achats/nouvelle">
        <Plus className="size-4 mr-2" />
        Nouvelle demande
      </Link>
    </Button>
  );
}
