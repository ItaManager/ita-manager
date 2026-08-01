"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function RechercheMateriel({ recherche }: { recherche: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [valeur, setValeur] = useState(recherche);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (valeur.trim()) {
      params.set("q", valeur.trim());
    } else {
      params.delete("q");
    }

    // Reset à la page 1 lors d'une nouvelle recherche
    params.delete("page");

    router.push(`/ressources?${params.toString()}`);
  }

  function handleClear() {
    setValeur("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");
    router.push(`/ressources?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1 max-w-md">
        <Input
          type="text"
          placeholder="Rechercher par code ITA, N° parc, code long..."
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          className="pr-8"
        />
        {valeur && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Effacer"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <Button type="submit" variant="default">
        <Search className="size-4 mr-2" />
        Rechercher
      </Button>
    </form>
  );
}
