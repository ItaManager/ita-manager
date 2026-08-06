"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FiltresContratsClientProps {
  recherche?: string;
  typeContrat?: string;
  echeance?: string;
}

export function FiltresContratsClient({
  recherche,
  typeContrat,
  echeance,
}: FiltresContratsClientProps) {
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
        value={typeContrat || ""}
        onChange={(e) => updateFilters("typeContrat", e.target.value)}
        disabled={isPending}
        className="h-12 rounded-lg border-2 border-border bg-background px-4 text-base cursor-pointer min-w-[180px] transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm hover:shadow-md"
      >
        <option value="">Tous les types</option>
        <option value="CDI">CDI</option>
        <option value="CDD">CDD</option>
        <option value="INTERIM">Intérim</option>
        <option value="STAGE">Stage</option>
      </select>

      <select
        value={echeance || ""}
        onChange={(e) => updateFilters("echeance", e.target.value)}
        disabled={isPending}
        className="h-12 rounded-lg border-2 border-border bg-background px-4 text-base cursor-pointer min-w-[180px] transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm hover:shadow-md"
      >
        <option value="">Toutes les échéances</option>
        <option value="30j">Moins de 30 jours</option>
        <option value="60j">Moins de 60 jours</option>
      </select>
    </div>
  );
}
