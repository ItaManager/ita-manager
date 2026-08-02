"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Clock,
  FileText,
  Inbox,
  Package,
  BarChart3,
  FileSpreadsheet,
  Search,
  Truck,
  Wrench as WrenchIcon,
  Users,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type MenuItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  permission: string;
  livraison: "L1" | "L2" | "L3";
  disponible: boolean;
};

const menuItems: MenuItem[] = [
  {
    label: "Tableau de bord",
    href: "/ressources/dashboard",
    icon: LayoutDashboard,
    permission: "materiel:lire",
    livraison: "L1",
    disponible: false,
  },
  {
    label: "Échéances",
    href: "/ressources/echeances",
    icon: Clock,
    permission: "materiel:lire",
    livraison: "L1",
    disponible: true,
  },
  {
    label: "Pièces administratives",
    href: "/ressources/pieces",
    icon: FileText,
    permission: "materiel:lire",
    livraison: "L1",
    disponible: true,
  },
  {
    label: "Demandes reçues",
    href: "/ressources/demandes",
    icon: Inbox,
    permission: "ressource:arbitrer",
    livraison: "L3",
    disponible: false,
  },
  {
    label: "Parc matériel",
    href: "/ressources",
    icon: Package,
    permission: "materiel:lire",
    livraison: "L1",
    disponible: true,
  },
  {
    label: "Stocks",
    href: "/ressources/stocks",
    icon: BarChart3,
    permission: "stock:lire",
    livraison: "L2",
    disponible: false,
  },
  {
    label: "Bons de mouvement",
    href: "/ressources/mouvements",
    icon: FileSpreadsheet,
    permission: "stock:mouvementer",
    livraison: "L2",
    disponible: false,
  },
  {
    label: "Inspections",
    href: "/ressources/inspections",
    icon: Search,
    permission: "materiel:inspecter",
    livraison: "L2",
    disponible: false,
  },
  {
    label: "Réceptions",
    href: "/ressources/receptions",
    icon: Inbox,
    permission: "reception:controler",
    livraison: "L2",
    disponible: false,
  },
  {
    label: "Entretien",
    href: "/ressources/entretien",
    icon: WrenchIcon,
    permission: "entretien:planifier",
    livraison: "L3",
    disponible: false,
  },
  {
    label: "Demandes de transport",
    href: "/ressources/transport",
    icon: Truck,
    permission: "transport:demander",
    livraison: "L3",
    disponible: false,
  },
  {
    label: "Chauffeurs",
    href: "/ressources/chauffeurs",
    icon: Users,
    permission: "materiel:lire",
    livraison: "L3",
    disponible: false,
  },
  {
    label: "Lieux de stockage",
    href: "/ressources/lieux",
    icon: MapPin,
    permission: "referentiel:creer",
    livraison: "L2",
    disponible: false,
  },
  {
    label: "Articles de stock",
    href: "/ressources/articles",
    icon: ShoppingBag,
    permission: "referentiel:creer",
    livraison: "L2",
    disponible: false,
  },
];

export function NavigationLogistique() {
  const pathname = usePathname();

  // Filtrer pour afficher seulement L1 disponibles dans les onglets principaux
  const ongletsL1 = menuItems.filter((item) => item.livraison === "L1" && item.disponible);

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex gap-8" aria-label="Navigation Logistique">
        {ongletsL1.map((onglet) => {
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

        {/* Lien "Toutes les fonctionnalités" pour voir L2 et L3 */}
        <button
          type="button"
          className="ml-auto flex items-center gap-2 border-b-2 border-transparent pb-3 pt-1 text-sm font-medium text-gray-400 cursor-not-allowed"
          disabled
          title="Livraisons L2 et L3 à venir"
        >
          <span className="text-xs">+ 11 autres</span>
          <Badge variant="outline" className="text-xs">
            L2/L3
          </Badge>
        </button>
      </nav>
    </div>
  );
}
