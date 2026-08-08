"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { BoutonNouveauContrat } from "./bouton-nouveau-contrat";

interface BarreRechercheContratsProps {
  counts: {
    actifs: number;
    cdd: number;
    cdi: number;
    expirant: number;
    tous: number;
  };
  employes: Array<{ id: string; nom: string; prenom: string; matricule: string }>;
}

export function BarreRechercheContrats({ counts, employes }: BarreRechercheContratsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const statutActuel = searchParams.get("statut") || "actifs";
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
        params.set("page", "1");
        startTransition(() => {
          router.push(`/contrats?${params.toString()}`);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [recherche, rechercheActuelle, router, searchParams]);

  const changerStatut = (nouveauStatut: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("statut", nouveauStatut);
    params.set("page", "1");
    startTransition(() => {
      router.push(`/contrats?${params.toString()}`);
    });
  };

  const changerTypeContrat = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "tous") {
      params.delete("typeContrat");
    } else {
      params.set("typeContrat", type);
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`/contrats?${params.toString()}`);
    });
  };

  const changerEcheance = (echeance: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (echeance === "tous") {
      params.delete("echeance");
    } else {
      params.set("echeance", echeance);
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`/contrats?${params.toString()}`);
    });
  };

  const effacerRecherche = () => {
    setRecherche("");
  };

  const typeActuel = searchParams.get("typeContrat") || "tous";
  const echeanceActuelle = searchParams.get("echeance") || "tous";

  return (
    <div className="space-y-3">
      {/* Barre de recherche avec bouton */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher par nom, prénom ou matricule..."
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
        <BoutonNouveauContrat employes={employes} />
      </div>

      {/* Filtres principaux */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => changerStatut("actifs")}>
          <Badge
            variant={statutActuel === "actifs" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Actifs <span className="ml-1 opacity-70">({counts.actifs})</span>
          </Badge>
        </button>
        <button onClick={() => changerTypeContrat("CDD")}>
          <Badge
            variant={typeActuel === "CDD" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            CDD <span className="ml-1 opacity-70">({counts.cdd})</span>
          </Badge>
        </button>
        <button onClick={() => changerTypeContrat("CDI")}>
          <Badge
            variant={typeActuel === "CDI" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            CDI <span className="ml-1 opacity-70">({counts.cdi})</span>
          </Badge>
        </button>
        <button onClick={() => changerEcheance("30j")}>
          <Badge
            variant={echeanceActuelle === "30j" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Expiration &lt; 30j <span className="ml-1 opacity-70">({counts.expirant})</span>
          </Badge>
        </button>
        <button onClick={() => changerStatut("tous")}>
          <Badge
            variant={statutActuel === "tous" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Tous <span className="ml-1 opacity-70">({counts.tous})</span>
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
