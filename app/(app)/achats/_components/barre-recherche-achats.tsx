"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { BoutonNouvelleDemande } from "./bouton-nouvelle-demande";

interface BarreRechercheAchatsProps {
  counts: {
    toutes: number;
    brouillon: number;
    attenteN1: number;
    attenteAchats: number;
    bcEmis: number;
    soldees: number;
    refusees: number;
  };
}

export function BarreRechercheAchats({ counts }: BarreRechercheAchatsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filtreActuel = searchParams.get("filtre") || "toutes";
  const rechercheActuelle = searchParams.get("recherche") || "";

  const [recherche, setRecherche] = useState(rechercheActuelle);

  // Debounce la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (recherche !== rechercheActuelle) {
        const params = new URLSearchParams(searchParams.toString());
        if (recherche) {
          params.set("recherche", recherche);
        } else {
          params.delete("recherche");
        }
        startTransition(() => {
          router.push(`/achats?${params.toString()}`);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [recherche, rechercheActuelle, router, searchParams]);

  const changerFiltre = (nouveauFiltre: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filtre", nouveauFiltre);
    startTransition(() => {
      router.push(`/achats?${params.toString()}`);
    });
  };

  const effacerRecherche = () => {
    setRecherche("");
  };

  return (
    <div className="space-y-3">
      {/* Barre de recherche avec bouton */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher une demande par référence, description..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="pl-10 pr-10 h-10"
          />
          {recherche && (
            <button
              onClick={effacerRecherche}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Effacer la recherche"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <BoutonNouvelleDemande />
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => changerFiltre("toutes")}>
          <Badge
            variant={filtreActuel === "toutes" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Toutes <span className="ml-1 opacity-70">({counts.toutes})</span>
          </Badge>
        </button>
        <button onClick={() => changerFiltre("brouillon")}>
          <Badge
            variant={filtreActuel === "brouillon" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Brouillon <span className="ml-1 opacity-70">({counts.brouillon})</span>
          </Badge>
        </button>
        <button onClick={() => changerFiltre("attente-n1")}>
          <Badge
            variant={filtreActuel === "attente-n1" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Attente N+1 <span className="ml-1 opacity-70">({counts.attenteN1})</span>
          </Badge>
        </button>
        <button onClick={() => changerFiltre("attente-achats")}>
          <Badge
            variant={filtreActuel === "attente-achats" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Attente Achats <span className="ml-1 opacity-70">({counts.attenteAchats})</span>
          </Badge>
        </button>
        <button onClick={() => changerFiltre("bc-emis")}>
          <Badge
            variant={filtreActuel === "bc-emis" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            BC émis <span className="ml-1 opacity-70">({counts.bcEmis})</span>
          </Badge>
        </button>
        <button onClick={() => changerFiltre("soldees")}>
          <Badge
            variant={filtreActuel === "soldees" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Soldées <span className="ml-1 opacity-70">({counts.soldees})</span>
          </Badge>
        </button>
        <button onClick={() => changerFiltre("refusees")}>
          <Badge
            variant={filtreActuel === "refusees" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Refusées <span className="ml-1 opacity-70">({counts.refusees})</span>
          </Badge>
        </button>
      </div>

      {/* Indicateur de chargement */}
      {isPending && (
        <div className="text-xs text-muted-foreground">
          Chargement...
        </div>
      )}
    </div>
  );
}
