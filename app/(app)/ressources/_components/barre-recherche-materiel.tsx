"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { FormNouveauMateriel } from "./form-nouveau-materiel";

interface BarreRechercheMaterielProps {
  counts: {
    disponibles: number;
    enService: number;
    enMaintenance: number;
    horsService: number;
    vehicules: number;
    engins: number;
    materiel: number;
    outillage: number;
    tous: number;
  };
  familles: Array<{ id: string; code: string; libelle: string; type: any }>;
  lieux: Array<{ id: string; libelle: string }>;
}

export function BarreRechercheMateriel({ counts, familles, lieux }: BarreRechercheMaterielProps) {
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
        params.delete("page"); // Reset page lors de la recherche
        startTransition(() => {
          router.push(`/ressources?${params.toString()}`);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [recherche, rechercheActuelle, router, searchParams]);

  const changerFiltre = (nouveauFiltre: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filtre", nouveauFiltre);
    params.delete("page"); // Reset page lors du changement de filtre
    startTransition(() => {
      router.push(`/ressources?${params.toString()}`);
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
            placeholder="Rechercher par code, désignation, marque, immatriculation..."
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
        <FormNouveauMateriel familles={familles} lieux={lieux} />
      </div>

      {/* Filtres par statut */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Par statut
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => changerFiltre("disponibles")}>
            <Badge
              variant={filtreActuel === "disponibles" ? "default" : "outline"}
              className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
            >
              Disponibles <span className="ml-1 opacity-70">({counts.disponibles})</span>
            </Badge>
          </button>
          <button onClick={() => changerFiltre("en-service")}>
            <Badge
              variant={filtreActuel === "en-service" ? "default" : "outline"}
              className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
            >
              En service <span className="ml-1 opacity-70">({counts.enService})</span>
            </Badge>
          </button>
          <button onClick={() => changerFiltre("en-maintenance")}>
            <Badge
              variant={filtreActuel === "en-maintenance" ? "default" : "outline"}
              className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
            >
              Maintenance <span className="ml-1 opacity-70">({counts.enMaintenance})</span>
            </Badge>
          </button>
          <button onClick={() => changerFiltre("hors-service")}>
            <Badge
              variant={filtreActuel === "hors-service" ? "default" : "outline"}
              className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
            >
              Hors service <span className="ml-1 opacity-70">({counts.horsService})</span>
            </Badge>
          </button>
        </div>
      </div>

      {/* Filtres par type */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Par type
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => changerFiltre("vehicules")}>
            <Badge
              variant={filtreActuel === "vehicules" ? "default" : "outline"}
              className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
            >
              Véhicules <span className="ml-1 opacity-70">({counts.vehicules})</span>
            </Badge>
          </button>
          <button onClick={() => changerFiltre("engins")}>
            <Badge
              variant={filtreActuel === "engins" ? "default" : "outline"}
              className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
            >
              Engins <span className="ml-1 opacity-70">({counts.engins})</span>
            </Badge>
          </button>
          <button onClick={() => changerFiltre("materiel")}>
            <Badge
              variant={filtreActuel === "materiel" ? "default" : "outline"}
              className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
            >
              Matériel <span className="ml-1 opacity-70">({counts.materiel})</span>
            </Badge>
          </button>
          <button onClick={() => changerFiltre("outillage")}>
            <Badge
              variant={filtreActuel === "outillage" ? "default" : "outline"}
              className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
            >
              Outillage <span className="ml-1 opacity-70">({counts.outillage})</span>
            </Badge>
          </button>
          <button onClick={() => changerFiltre("tous")}>
            <Badge
              variant={filtreActuel === "tous" ? "default" : "outline"}
              className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
            >
              Tous <span className="ml-1 opacity-70">({counts.tous})</span>
            </Badge>
          </button>
        </div>
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
