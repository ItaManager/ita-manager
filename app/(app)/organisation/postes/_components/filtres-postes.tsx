"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
  services,
  directionIdActif,
  serviceIdActif,
  niveauActif,
  rechercheActive,
}: FiltresPostesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(rechercheActive || "");

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    const timeoutId = setTimeout(() => {
      updateFilters("recherche", value);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-primary pointer-events-none" />
        <Input
          placeholder="Rechercher un poste..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-12 h-12 text-base border-2 border-border focus:border-primary transition-all shadow-sm focus:shadow-md"
          disabled={isPending}
        />
      </div>

      <select
        value={directionIdActif || ""}
        onChange={(e) => updateFilters("direction", e.target.value)}
        disabled={isPending}
        className="h-12 rounded-lg border-2 border-border bg-background px-4 text-base cursor-pointer min-w-[180px] transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm hover:shadow-md"
      >
        <option value="">Toutes les directions</option>
        {directions.map((dir) => (
          <option key={dir.id} value={dir.id}>
            {dir.libelle}
          </option>
        ))}
      </select>

      <select
        value={serviceIdActif || ""}
        onChange={(e) => updateFilters("service", e.target.value)}
        disabled={isPending}
        className="h-12 rounded-lg border-2 border-border bg-background px-4 text-base cursor-pointer min-w-[180px] transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm hover:shadow-md"
      >
        <option value="">Tous les services</option>
        {services
          .filter((s) => !directionIdActif || s.directionId === directionIdActif)
          .map((service) => (
            <option key={service.id} value={service.id}>
              {service.libelle}
            </option>
          ))}
      </select>

      <select
        value={niveauActif || ""}
        onChange={(e) => updateFilters("niveau", e.target.value)}
        disabled={isPending}
        className="h-12 rounded-lg border-2 border-border bg-background px-4 text-base cursor-pointer min-w-[180px] transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm hover:shadow-md"
      >
        <option value="">Tous les niveaux</option>
        <option value="DIRECTION">Direction</option>
        <option value="CADRE">Cadre</option>
        <option value="SUPPORT">Support</option>
        <option value="OPERATIONNEL">Opérationnel</option>
      </select>
    </div>
  );
}
