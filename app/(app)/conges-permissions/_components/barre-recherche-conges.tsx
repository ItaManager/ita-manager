"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";

interface BarreRechercheCongesProps {
  counts: {
    eligibles: number;
    nonEligibles: number;
    avecDemandes: number;
    tous: number;
  };
}

export function BarreRechercheConges({ counts }: BarreRechercheCongesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filtreActuel = searchParams.get("filtre") || "tous";
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
          router.push(`/conges-permissions?${params.toString()}`);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [recherche, rechercheActuelle, router, searchParams]);

  const changerFiltre = (nouveauFiltre: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filtre", nouveauFiltre);
    startTransition(() => {
      router.push(`/conges-permissions?${params.toString()}`);
    });
  };

  const effacerRecherche = () => {
    setRecherche("");
  };

  return (
    <div className="space-y-3">
      {/* Barre de recherche */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un employé par matricule ou nom..."
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
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => changerFiltre("tous")}>
          <Badge
            variant={filtreActuel === "tous" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Tous <span className="ml-1 opacity-70">({counts.tous})</span>
          </Badge>
        </button>
        <button onClick={() => changerFiltre("eligibles")}>
          <Badge
            variant={filtreActuel === "eligibles" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Éligibles <span className="ml-1 opacity-70">({counts.eligibles})</span>
          </Badge>
        </button>
        <button onClick={() => changerFiltre("non-eligibles")}>
          <Badge
            variant={filtreActuel === "non-eligibles" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Non éligibles <span className="ml-1 opacity-70">({counts.nonEligibles})</span>
          </Badge>
        </button>
        <button onClick={() => changerFiltre("avec-demandes")}>
          <Badge
            variant={filtreActuel === "avec-demandes" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Avec demandes <span className="ml-1 opacity-70">({counts.avecDemandes})</span>
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
