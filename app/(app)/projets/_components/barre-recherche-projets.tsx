"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { BoutonNouveauProjet } from "./bouton-nouveau-projet";

interface BarreRechercheProjetsProps {
  counts: {
    brouillon: number;
    ouvert: number;
    enCours: number;
    suspendu: number;
    cloture: number;
    tous: number;
  };
}

export function BarreRechercheProjets({ counts }: BarreRechercheProjetsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const statutActuel = searchParams.get("statut") || "";
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
          router.push(`/projets?${params.toString()}`);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [recherche, rechercheActuelle, router, searchParams]);

  const changerStatut = (nouveauStatut: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nouveauStatut) {
      params.set("statut", nouveauStatut);
    } else {
      params.delete("statut");
    }
    startTransition(() => {
      router.push(`/projets?${params.toString()}`);
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
            placeholder="Rechercher un projet par code, nom ou maître d'ouvrage..."
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
        <BoutonNouveauProjet />
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => changerStatut("")}>
          <Badge
            variant={!statutActuel ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Tous <span className="ml-1 opacity-70">({counts.tous})</span>
          </Badge>
        </button>
        <button onClick={() => changerStatut("BROUILLON")}>
          <Badge
            variant={statutActuel === "BROUILLON" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Brouillon <span className="ml-1 opacity-70">({counts.brouillon})</span>
          </Badge>
        </button>
        <button onClick={() => changerStatut("OUVERT")}>
          <Badge
            variant={statutActuel === "OUVERT" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Ouvert <span className="ml-1 opacity-70">({counts.ouvert})</span>
          </Badge>
        </button>
        <button onClick={() => changerStatut("EN_COURS")}>
          <Badge
            variant={statutActuel === "EN_COURS" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            En cours <span className="ml-1 opacity-70">({counts.enCours})</span>
          </Badge>
        </button>
        <button onClick={() => changerStatut("SUSPENDU")}>
          <Badge
            variant={statutActuel === "SUSPENDU" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Suspendu <span className="ml-1 opacity-70">({counts.suspendu})</span>
          </Badge>
        </button>
        <button onClick={() => changerStatut("CLOTURE")}>
          <Badge
            variant={statutActuel === "CLOTURE" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Clôturé <span className="ml-1 opacity-70">({counts.cloture})</span>
          </Badge>
        </button>
      </div>

      {/* Indicateur de chargement */}
      {isPending && (
        <div className="text-xs text-muted-foreground">Chargement...</div>
      )}
    </div>
  );
}
