"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { BoutonNouvelleCompetence } from "./bouton-nouvelle-competence";

interface BarreRechercheProps {
  counts: {
    actives: number;
    sansTaux: number;
    composees: number;
    archivees: number;
    toutes: number;
  };
}

export function BarreRecherche({ counts }: BarreRechercheProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filtreActuel = searchParams.get("filtre") || "actives";
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
          router.push(`/personnel/competences?${params.toString()}`);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [recherche, rechercheActuelle, router, searchParams]);

  const changerFiltre = (nouveauFiltre: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filtre", nouveauFiltre);
    startTransition(() => {
      router.push(`/personnel/competences?${params.toString()}`);
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
            placeholder="Rechercher une compétence par nom..."
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
        <BoutonNouvelleCompetence />
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => changerFiltre("actives")}>
          <Badge
            variant={filtreActuel === "actives" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Actives <span className="ml-1 opacity-70">({counts.actives})</span>
          </Badge>
        </button>
        <button onClick={() => changerFiltre("sans-taux")}>
          <Badge
            variant={filtreActuel === "sans-taux" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Sans taux <span className="ml-1 opacity-70">({counts.sansTaux})</span>
          </Badge>
        </button>
        <button onClick={() => changerFiltre("composees")}>
          <Badge
            variant={filtreActuel === "composees" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Composées <span className="ml-1 opacity-70">({counts.composees})</span>
          </Badge>
        </button>
        <button onClick={() => changerFiltre("archivees")}>
          <Badge
            variant={filtreActuel === "archivees" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Archivées <span className="ml-1 opacity-70">({counts.archivees})</span>
          </Badge>
        </button>
        <button onClick={() => changerFiltre("toutes")}>
          <Badge
            variant={filtreActuel === "toutes" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Toutes <span className="ml-1 opacity-70">({counts.toutes})</span>
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
