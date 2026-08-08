"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Loader2 } from "lucide-react";
import type { TypeMainOeuvre } from "@prisma/client";

interface FiltresEmployesClientProps {
  recherche?: string;
  typeMainOeuvre?: TypeMainOeuvre;
  directionId?: string;
  serviceId?: string;
  statutDossier?: "COMPLET" | "INCOMPLET";
  disponibilite?: "EN_MISSION" | "DISPONIBLE";
  directions: Array<{ id: string; libelle: string }>;
  services: Array<{ id: string; libelle: string; directionId: string }>;
  counts: {
    total: number;
    permanents: number;
    journaliers: number;
    dossiersIncomplets: number;
    sansAcces: number;
    enMission?: number;
    disponibles?: number;
  };
  boutonAjout: React.ReactNode;
}

export function FiltresEmployesClient({
  recherche: rechercheInitiale,
  typeMainOeuvre,
  directionId,
  serviceId,
  statutDossier,
  disponibilite,
  directions,
  services,
  counts,
  boutonAjout,
}: FiltresEmployesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [recherche, setRecherche] = useState(rechercheInitiale || "");

  // Extraire le basePath de l'URL actuelle (ex: /employes ou /journaliers)
  const basePath = pathname.split('?')[0];

  // Debounce la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (recherche !== rechercheInitiale) {
        const params = new URLSearchParams(searchParams.toString());
        if (recherche) {
          params.set("recherche", recherche);
        } else {
          params.delete("recherche");
        }
        params.delete("page"); // Retour page 1 = pas de param
        startTransition(() => {
          const query = params.toString();
          router.push(query ? `${basePath}?${query}` : basePath);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [recherche, rechercheInitiale, router, searchParams]);

  const changerFiltre = (cle: string, valeur: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // Réinitialiser les filtres dépendants
    if (cle === "typeMainOeuvre") {
      // Si on change le type, on peut garder direction/service
      if (valeur === typeMainOeuvre) {
        params.delete("typeMainOeuvre");
      } else {
        params.set("typeMainOeuvre", valeur);
      }
    } else if (cle === "directionId") {
      if (valeur === directionId) {
        params.delete("directionId");
        params.delete("serviceId"); // Reset service
      } else {
        params.set("directionId", valeur);
        params.delete("serviceId"); // Reset service
      }
    } else if (cle === "serviceId") {
      if (valeur === serviceId) {
        params.delete("serviceId");
      } else {
        params.set("serviceId", valeur);
      }
    } else if (cle === "statutDossier") {
      if (valeur === statutDossier) {
        params.delete("statutDossier");
      } else {
        params.set("statutDossier", valeur);
      }
    }

    params.delete("page"); // Retour page 1 = pas de param
    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${basePath}?${query}` : basePath);
    });
  };

  const effacerRecherche = () => {
    setRecherche("");
  };

  // Filtrer les services selon la direction sélectionnée
  const servicesFiltres = services.filter(
    (s) => !directionId || s.directionId === directionId
  );

  // Détecter si on est sur la page journaliers
  const isPageJournaliers = basePath.includes("/journaliers");

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
        {boutonAjout}
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Type de main d'œuvre - seulement sur page employés */}
        {!isPageJournaliers && (
          <>
            <button onClick={() => changerFiltre("typeMainOeuvre", "PERMANENT")}>
              <Badge
                variant={typeMainOeuvre === "PERMANENT" ? "default" : "outline"}
                className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
              >
                Permanents{" "}
                <span className="ml-1 opacity-70">({counts.permanents})</span>
              </Badge>
            </button>
            <button onClick={() => changerFiltre("typeMainOeuvre", "JOURNALIER")}>
              <Badge
                variant={typeMainOeuvre === "JOURNALIER" ? "default" : "outline"}
                className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
              >
                Journaliers{" "}
                <span className="ml-1 opacity-70">({counts.journaliers})</span>
              </Badge>
            </button>
            <div className="w-px h-6 bg-border mx-1" />
          </>
        )}

        {/* Disponibilité - seulement sur page journaliers */}
        {isPageJournaliers && (
          <>
            <button onClick={() => changerFiltre("disponibilite", "EN_MISSION")}>
              <Badge
                variant={disponibilite === "EN_MISSION" ? "default" : "outline"}
                className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
              >
                En mission{" "}
                <span className="ml-1 opacity-70">({counts.enMission || 0})</span>
              </Badge>
            </button>
            <button onClick={() => changerFiltre("disponibilite", "DISPONIBLE")}>
              <Badge
                variant={disponibilite === "DISPONIBLE" ? "default" : "outline"}
                className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
              >
                Disponibles{" "}
                <span className="ml-1 opacity-70">({counts.disponibles || 0})</span>
              </Badge>
            </button>
            <div className="w-px h-6 bg-border mx-1" />
          </>
        )}

        {/* Directions et services - pour tous */}
        {directions.map((dir) => (
          <button
            key={dir.id}
            onClick={() => changerFiltre("directionId", dir.id)}
          >
            <Badge
              variant={directionId === dir.id ? "default" : "outline"}
              className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
            >
              {dir.libelle}
            </Badge>
          </button>
        ))}
        {directionId && servicesFiltres.length > 0 && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            {servicesFiltres.map((service) => (
              <button
                key={service.id}
                onClick={() => changerFiltre("serviceId", service.id)}
              >
                <Badge
                  variant={serviceId === service.id ? "default" : "outline"}
                  className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                >
                  {service.libelle}
                </Badge>
              </button>
            ))}
          </>
        )}

        {/* Statut dossier - pour tous */}
        <div className="w-px h-6 bg-border mx-1" />
        <button onClick={() => changerFiltre("statutDossier", "INCOMPLET")}>
          <Badge
            variant={statutDossier === "INCOMPLET" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Dossiers incomplets{" "}
            <span className="ml-1 opacity-70">({counts.dossiersIncomplets})</span>
          </Badge>
        </button>
        <button onClick={() => changerFiltre("statutDossier", "COMPLET")}>
          <Badge
            variant={statutDossier === "COMPLET" ? "default" : "outline"}
            className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
          >
            Dossiers complets
          </Badge>
        </button>
      </div>

      {/* Indicateur de chargement */}
      {isPending && (
        <div className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin text-[#13850b]" />
          <span className="text-xs text-muted-foreground">Chargement des données...</span>
        </div>
      )}
    </div>
  );
}
