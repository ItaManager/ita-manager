"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export function FiltresAO() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRecherche = (valeur: string) => {
    const params = new URLSearchParams(searchParams);
    if (valeur) {
      params.set("recherche", valeur);
    } else {
      params.delete("recherche");
    }
    params.delete("cursor");
    router.push(`/appels-offres?${params.toString()}`);
  };

  const handleStatut = (valeur: string) => {
    const params = new URLSearchParams(searchParams);
    if (valeur && valeur !== "tous") {
      params.set("statut", valeur);
    } else {
      params.delete("statut");
    }
    params.delete("cursor");
    router.push(`/appels-offres?${params.toString()}`);
  };

  const handleTypeMarche = (valeur: string) => {
    const params = new URLSearchParams(searchParams);
    if (valeur && valeur !== "tous") {
      params.set("typeMarche", valeur);
    } else {
      params.delete("typeMarche");
    }
    params.delete("cursor");
    router.push(`/appels-offres?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par référence, maître d'ouvrage, objet..."
          defaultValue={searchParams.get("recherche") || ""}
          onChange={(e) => handleRecherche(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        defaultValue={searchParams.get("statut") || "tous"}
        onValueChange={handleStatut}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tous">Tous les statuts</SelectItem>
          <SelectItem value="VEILLE">Veille</SelectItem>
          <SelectItem value="GO">Go validé</SelectItem>
          <SelectItem value="CONSTITUTION">Constitution</SelectItem>
          <SelectItem value="SOUMIS">Soumis</SelectItem>
          <SelectItem value="GAGNE">Gagnés</SelectItem>
          <SelectItem value="PERDU">Perdus</SelectItem>
          <SelectItem value="ABANDONNE">Abandonnés</SelectItem>
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("typeMarche") || "tous"}
        onValueChange={handleTypeMarche}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Type de marché" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tous">Tous les types</SelectItem>
          <SelectItem value="PUBLIC">Public</SelectItem>
          <SelectItem value="PRIVE">Privé</SelectItem>
          <SelectItem value="INTERNATIONAL">International</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
