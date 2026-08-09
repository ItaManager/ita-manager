"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface TabsCongesProps {
  vueActive: "mes-demandes" | "a-valider" | "controle-rh" | "equipe";
}

const TABS = [
  { id: "mes-demandes", label: "Mes demandes" },
  { id: "a-valider", label: "À valider (N+1)" },
  { id: "controle-rh", label: "Contrôle RH" },
  { id: "equipe", label: "Équipe" },
] as const;

export function TabsConges({ vueActive }: TabsCongesProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const construireUrl = (vue: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("vue", vue);
    params.delete("page"); // Reset pagination
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="border-b border-border">
      <div className="flex gap-1">
        {TABS.map((tab) => {
          const actif = tab.id === vueActive;

          return (
            <Link
              key={tab.id}
              href={construireUrl(tab.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors",
                actif
                  ? "bg-white text-foreground border-t border-l border-r border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
