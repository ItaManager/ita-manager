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
import { useState, useTransition, useEffect } from "react";
import { ComboboxService } from "./combobox-service";
import type { Direction, Service, NiveauHierarchique } from "@prisma/client";

interface FiltresPostesProps {
  directions: Direction[];
  services: Service[];
  directionIdActif?: string;
  serviceIdActif?: string;
  niveauActif?: NiveauHierarchique;
  rechercheActive?: string;
}

export function FiltresPostes({
  directions,
  services: servicesInitiaux,
  directionIdActif,
  serviceIdActif,
  niveauActif,
  rechercheActive,
}: FiltresPostesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [recherche, setRecherche] = useState(rechercheActive ?? "");
  const [direction, setDirection] = useState(directionIdActif ?? "tous");
  const [service, setService] = useState<string | null>(serviceIdActif ?? null);
  const [niveau, setNiveau] = useState(niveauActif ?? "tous");
  const [services, setServices] = useState(servicesInitiaux);

  // Réinitialiser le service si la direction change
  useEffect(() => {
    if (direction === "tous") {
      setService(null);
    } else if (service) {
      const serviceExiste = services.find(
        (s) => s.id === service && s.directionId === direction
      );
      if (!serviceExiste) {
        setService(null);
      }
    }
  }, [direction, service, services]);

  const appliquerFiltres = () => {
    const params = new URLSearchParams();

    if (direction && direction !== "tous") {
      params.set("direction", direction);
    }

    if (service) {
      params.set("service", service);
    }

    if (niveau && niveau !== "tous") {
      params.set("niveau", niveau);
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
    setService(null);
    setNiveau("tous");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const filtresActifs =
    directionIdActif || serviceIdActif || niveauActif || rechercheActive;

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
              placeholder="Rechercher un poste..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  appliquerFiltres();
                }
              }}
              className="pl-9"
              aria-label="Rechercher un poste"
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

          {/* Filtre Service */}
          <div className="w-[200px]">
            <ComboboxService
              services={services}
              directionId={direction === "tous" ? null : direction}
              value={service}
              onChange={setService}
              onServiceCreated={(nouveauService) => {
                setServices([...services, nouveauService]);
              }}
            />
          </div>

          {/* Filtre Niveau */}
          <Select value={niveau} onValueChange={setNiveau}>
            <SelectTrigger className="w-[200px]" aria-label="Filtrer par niveau">
              <SelectValue placeholder="Tous niveaux" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous niveaux</SelectItem>
              <SelectItem value="DIRECTION">Direction</SelectItem>
              <SelectItem value="CADRE">Cadre</SelectItem>
              <SelectItem value="SUPPORT">Support</SelectItem>
              <SelectItem value="OPERATIONNEL">Opérationnel</SelectItem>
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
