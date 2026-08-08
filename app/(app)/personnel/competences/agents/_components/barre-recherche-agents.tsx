"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";

interface BarreRechercheAgentsProps {
  counts: {
    tous: number;
    sansCompetence: number;
    surChantier: number;
  };
}

export function BarreRechercheAgents({ counts }: BarreRechercheAgentsProps) {
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
          router.push(`/personnel/competences/agents?${params.toString()}`);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [recherche, rechercheActuelle, router, searchParams]);

  const changerFiltre = (nouveauFiltre: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filtre", nouveauFiltre);
    startTransition(() => {
      router.push(`/personnel/competences/agents?${params.toString()}`);
    });
  };

  const effacerRecherche = () => {
    setRecherche("");
  };

  return (
    <div className="space-y-3">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un agent par nom, prénom ou matricule..."
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
        <button onClick={() => changerFiltre("sans-competence")}>
          <Badge
            variant={filtreActuel === "sans-competence" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Sans compétence <span className="ml-1 opacity-70">({counts.sansCompetence})</span>
          </Badge>
        </button>
        <button onClick={() => changerFiltre("sur-chantier")}>
          <Badge
            variant={filtreActuel === "sur-chantier" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Sur chantier <span className="ml-1 opacity-70">({counts.surChantier})</span>
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
