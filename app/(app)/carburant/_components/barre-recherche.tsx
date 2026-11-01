"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { BoutonNouvelleDemande } from "./bouton-nouvelle-demande";

interface BarreRechercheProps {
  counts: {
    brouillon: number;
    enAttente: number;
    validees: number;
    livrees: number;
    refusees: number;
    toutes: number;
  };
}

export function BarreRecherche({ counts }: BarreRechercheProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const statutActuel = searchParams.get("statut") || "toutes";
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
          router.push(`/carburant?${params.toString()}`);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [recherche, rechercheActuelle, router, searchParams]);

  const changerStatut = (nouveauStatut: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("statut", nouveauStatut);
    startTransition(() => {
      router.push(`/carburant?${params.toString()}`);
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
            placeholder="Rechercher une demande par référence, demandeur ou véhicule..."
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
        <button onClick={() => changerStatut("brouillon")}>
          <Badge
            variant={statutActuel === "brouillon" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Brouillon <span className="ml-1 opacity-70">({counts.brouillon})</span>
          </Badge>
        </button>
        <button onClick={() => changerStatut("en-attente")}>
          <Badge
            variant={statutActuel === "en-attente" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            En attente <span className="ml-1 opacity-70">({counts.enAttente})</span>
          </Badge>
        </button>
        <button onClick={() => changerStatut("validees")}>
          <Badge
            variant={statutActuel === "validees" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Validées <span className="ml-1 opacity-70">({counts.validees})</span>
          </Badge>
        </button>
        <button onClick={() => changerStatut("livrees")}>
          <Badge
            variant={statutActuel === "livrees" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Livrées <span className="ml-1 opacity-70">({counts.livrees})</span>
          </Badge>
        </button>
        <button onClick={() => changerStatut("refusees")}>
          <Badge
            variant={statutActuel === "refusees" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Refusées <span className="ml-1 opacity-70">({counts.refusees})</span>
          </Badge>
        </button>
        <button onClick={() => changerStatut("toutes")}>
          <Badge
            variant={statutActuel === "toutes" ? "default" : "outline"}
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
