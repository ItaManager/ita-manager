"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { TypeMainOeuvre } from "@prisma/client";

interface FiltresEmployesClientProps {
  recherche?: string;
  typeMainOeuvre?: TypeMainOeuvre;
  directionId?: string;
  statutDossier?: "COMPLET" | "INCOMPLET";
}

export function FiltresEmployesClient({
  recherche,
  typeMainOeuvre,
  directionId,
  statutDossier,
}: FiltresEmployesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(recherche || "");

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
          placeholder="Rechercher par nom, prénom ou matricule..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-12 h-12 text-base border-2 border-border focus:border-primary transition-all shadow-sm focus:shadow-md"
          disabled={isPending}
        />
      </div>

      <select
        value={typeMainOeuvre || ""}
        onChange={(e) => updateFilters("typeMainOeuvre", e.target.value)}
        disabled={isPending}
        className="h-12 rounded-lg border-2 border-border bg-background px-4 text-base cursor-pointer min-w-[180px] transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm hover:shadow-md"
      >
        <option value="">Tous les types</option>
        <option value="PERMANENT">Permanent</option>
        <option value="JOURNALIER">Journalier</option>
      </select>

      <select
        value={directionId || ""}
        onChange={(e) => updateFilters("directionId", e.target.value)}
        disabled={isPending}
        className="h-12 rounded-lg border-2 border-border bg-background px-4 text-base cursor-pointer min-w-[180px] transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm hover:shadow-md"
      >
        <option value="">Toutes les directions</option>
      </select>

      <select
        value={statutDossier || ""}
        onChange={(e) => updateFilters("statutDossier", e.target.value)}
        disabled={isPending}
        className="h-12 rounded-lg border-2 border-border bg-background px-4 text-base cursor-pointer min-w-[180px] transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm hover:shadow-md"
      >
        <option value="">Tous les statuts</option>
        <option value="COMPLET">Dossier complet</option>
        <option value="INCOMPLET">Dossier incomplet</option>
      </select>
    </div>
  );
}
