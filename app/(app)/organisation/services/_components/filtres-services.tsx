"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useState, useTransition } from "react";
import type { Direction } from "@prisma/client";

interface FiltresServicesProps {
  directions: Direction[];
  directionIdActif?: string;
  rechercheActive?: string;
}

export function FiltresServices({
  directions,
  directionIdActif,
  rechercheActive,
}: FiltresServicesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [recherche, setRecherche] = useState(rechercheActive ?? "");
  const [direction, setDirection] = useState(directionIdActif ?? "tous");

  const appliquerFiltres = () => {
    const params = new URLSearchParams();

    if (direction && direction !== "tous") {
      params.set("direction", direction);
    }

    if (recherche.trim()) {
      params.set("recherche", recherche.trim());
    }

    // Retour à la page 1 lors d'un changement de filtre
    const url = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    startTransition(() => {
      router.push(url);
    });
  };

  const reinitialiser = () => {
    setRecherche("");
    setDirection("tous");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const filtresActifs = directionIdActif || rechercheActive;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-4">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Rechercher un service..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  appliquerFiltres();
                }
              }}
              className="pl-9"
              aria-label="Rechercher un service"
            />
          </div>

          {/* Filtre Direction */}
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="w-[200px]" aria-label="Filtrer par direction">
              <SelectValue placeholder="Toutes directions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Toutes directions</SelectItem>
              {directions.map((dir) => (
                <SelectItem key={dir.id} value={dir.id}>
                  {dir.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Boutons */}
          <Button onClick={appliquerFiltres} disabled={isPending}>
            Filtrer
          </Button>

          {filtresActifs && (
            <Button
              variant="outline"
              onClick={reinitialiser}
              disabled={isPending}
              className="gap-2"
              aria-label="Réinitialiser les filtres"
            >
              <X className="size-4" aria-hidden="true" />
              Réinitialiser
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
