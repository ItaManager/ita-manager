"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface DerogationsFiltersProps {
  directions: Array<{ id: string; libelle: string }>;
}

export function DerogationsFilters({ directions }: DerogationsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statutActuel = searchParams.get("statut") || "tout";
  const directionActuelle = searchParams.get("directionId") || "tout";
  const periodeActuelle = searchParams.get("periode") || "tout";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "tout") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Filtre Statut */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Statut
            </label>
            <Select
              value={statutActuel}
              onValueChange={(value) => updateFilter("statut", value)}
            >
              <SelectTrigger aria-label="Filtrer par statut">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tout">Tous les statuts</SelectItem>
                <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                <SelectItem value="VALIDEE">Validées</SelectItem>
                <SelectItem value="REFUSEE">Refusées</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtre Direction */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Direction
            </label>
            <Select
              value={directionActuelle}
              onValueChange={(value) => updateFilter("directionId", value)}
            >
              <SelectTrigger aria-label="Filtrer par direction">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tout">Toutes les directions</SelectItem>
                {directions.map((direction) => (
                  <SelectItem key={direction.id} value={direction.id}>
                    {direction.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtre Période */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Période
            </label>
            <Select
              value={periodeActuelle}
              onValueChange={(value) => updateFilter("periode", value)}
            >
              <SelectTrigger aria-label="Filtrer par période">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tout">Toutes les dates</SelectItem>
                <SelectItem value="7j">7 derniers jours</SelectItem>
                <SelectItem value="30j">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
