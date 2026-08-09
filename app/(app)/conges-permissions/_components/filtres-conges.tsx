"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface FiltresCongesProps {
  recherche?: string;
  statut?: "EN_ATTENTE" | "APPROUVE_N1" | "VALIDE_RH" | "REFUSE";
  type?: "CONGE_ANNUEL" | "CONGE_MALADIE" | "PERMISSION" | "CONGE_SANS_SOLDE";
  dateDebut?: string;
  dateFin?: string;
}

export function FiltresConges({
  recherche,
  statut,
  type,
  dateDebut,
  dateFin,
}: FiltresCongesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [rechercheLocale, setRechercheLocale] = useState(recherche || "");

  const changerFiltre = (cle: string, valeur: string | undefined) => {
    const params = new URLSearchParams(searchParams);

    if (valeur && valeur !== "") {
      params.set(cle, valeur);
    } else {
      params.delete(cle);
    }

    // Reset page
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleRecherche = (value: string) => {
    setRechercheLocale(value);
    const timeoutId = setTimeout(() => {
      changerFiltre("recherche", value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 flex-1">
      {/* Recherche */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un employé..."
          value={rechercheLocale}
          onChange={(e) => handleRecherche(e.target.value)}
          className="pl-9 h-11 rounded-md"
        />
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2">
        <button onClick={() => changerFiltre("statut", statut === "EN_ATTENTE" ? undefined : "EN_ATTENTE")}>
          <Badge variant={statut === "EN_ATTENTE" ? "default" : "outline"}>
            En attente
          </Badge>
        </button>
        <button onClick={() => changerFiltre("statut", statut === "APPROUVE_N1" ? undefined : "APPROUVE_N1")}>
          <Badge variant={statut === "APPROUVE_N1" ? "default" : "outline"}>
            Validé N+1
          </Badge>
        </button>
        <button onClick={() => changerFiltre("statut", statut === "VALIDE_RH" ? undefined : "VALIDE_RH")}>
          <Badge variant={statut === "VALIDE_RH" ? "default" : "outline"}>
            Validé RH
          </Badge>
        </button>
        <button onClick={() => changerFiltre("statut", statut === "REFUSE" ? undefined : "REFUSE")}>
          <Badge variant={statut === "REFUSE" ? "default" : "outline"}>
            Refusé
          </Badge>
        </button>
      </div>

      {/* Filtres type */}
      <div className="flex gap-2">
        <button onClick={() => changerFiltre("type", type === "CONGE_ANNUEL" ? undefined : "CONGE_ANNUEL")}>
          <Badge variant={type === "CONGE_ANNUEL" ? "default" : "outline"}>
            Congé annuel
          </Badge>
        </button>
        <button onClick={() => changerFiltre("type", type === "PERMISSION" ? undefined : "PERMISSION")}>
          <Badge variant={type === "PERMISSION" ? "default" : "outline"}>
            Permission
          </Badge>
        </button>
        <button onClick={() => changerFiltre("type", type === "CONGE_MALADIE" ? undefined : "CONGE_MALADIE")}>
          <Badge variant={type === "CONGE_MALADIE" ? "default" : "outline"}>
            Maladie
          </Badge>
        </button>
      </div>
    </div>
  );
}
