"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function BoutonNouveauProjet() {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push("/projets/nouveau")}
      className="gap-2 h-9 px-4 text-sm rounded-full bg-primary hover:bg-primary-hover text-primary-foreground transition-all cursor-pointer shadow-sm hover:shadow-md"
    >
      <Plus className="size-4" />
      Créer projet
    </Button>
  );
}
