"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Lock, Unlock, Download } from "lucide-react";
import type { TypeMateriel } from "@prisma/client";

interface FiltresTableauPiecesProps {
  typeMaterielActif?: TypeMateriel;
  rechercheInitiale?: string;
  masquerCoutsInitial?: boolean;
}

const FILTRES_TYPE_MATERIEL = [
  { label: "Tous", value: undefined },
  { label: "Véhicules légers", value: "VEHICULE_LEGER" as TypeMateriel },
  { label: "Poids lourds", value: "VEHICULE_LOURD" as TypeMateriel },
  { label: "Engins", value: "ENGIN" as TypeMateriel },
  { label: "Conteneurs", value: "CONTENEUR" as TypeMateriel },
] as const;

export function FiltresTableauPieces({
  typeMaterielActif,
  rechercheInitiale = "",
  masquerCoutsInitial = false,
}: FiltresTableauPiecesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [recherche, setRecherche] = useState(rechercheInitiale);

  function updateURL(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams);

    // Appliquer les mises à jour
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const newURL = `${pathname}?${params.toString()}`;

    startTransition(() => {
      router.push(newURL);
    });
  }

  function handleRechercheChange(value: string) {
    setRecherche(value);
    updateURL({ recherche: value || undefined });
  }

  function handleTypeMaterielChange(type: TypeMateriel | undefined) {
    updateURL({ typeMateriel: type });
  }

  function handleToggleMasquerCouts() {
    const newValue = !masquerCoutsInitial;
    updateURL({ masquerCouts: newValue ? "true" : undefined });
  }

  function handleExport() {
    // TODO: Implémenter l'export
    console.log("Export PDF/CSV");
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Barre de recherche */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Code, désignation, immatriculation, lieu"
            value={recherche}
            onChange={(e) => handleRechercheChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          size="default"
          onClick={handleToggleMasquerCouts}
          className="gap-2"
        >
          {masquerCoutsInitial ? (
            <>
              <Unlock className="size-4" aria-hidden="true" />
              Afficher les montants
            </>
          ) : (
            <>
              <Lock className="size-4" aria-hidden="true" />
              Masquer les montants
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="default"
          onClick={handleExport}
          className="gap-2"
        >
          <Download className="size-4" aria-hidden="true" />
          Exporter
        </Button>
      </div>

      {/* Filtres type matériel */}
      <div className="flex items-center gap-2">
        {FILTRES_TYPE_MATERIEL.map((filtre) => {
          const isActive = filtre.value === typeMaterielActif;

          return (
            <Button
              key={filtre.label}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeMaterielChange(filtre.value)}
              disabled={isPending}
            >
              {filtre.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
