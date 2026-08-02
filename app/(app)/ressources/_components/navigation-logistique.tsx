"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Wrench, Clock, FileText } from "lucide-react";

const onglets = [
  {
    label: "Registre",
    href: "/ressources",
    icon: Wrench,
    description: "Liste complète du matériel",
  },
  {
    label: "Échéances",
    href: "/ressources/echeances",
    icon: Clock,
    description: "Pièces arrivant à expiration",
  },
  {
    label: "Pièces administratives",
    href: "/ressources/pieces",
    icon: FileText,
    description: "Toutes les pièces du parc",
  },
];

export function NavigationLogistique() {
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex gap-8" aria-label="Navigation Logistique">
        {onglets.map((onglet) => {
          const Icon = onglet.icon;
          const isActive = pathname === onglet.href;

          return (
            <Link
              key={onglet.href}
              href={onglet.href}
              className={cn(
                "flex items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-medium transition-colors",
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{onglet.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
