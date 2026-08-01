"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { hasAccessToRoute } from "@/lib/auth/nav-permissions";
import {
  LayoutDashboard,
  Bell,
  Calendar,
  Users,
  Building2,
  Briefcase,
  FileText,
  Clock,
  CheckSquare,
  ClipboardList,
  FolderKanban,
  Lightbulb,
  PackageSearch,
  FileStack,
  DollarSign,
  Megaphone,
  BarChart3,
  UserCog,
  ScrollText,
  Settings,
  HelpCircle,
  ShoppingCart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  moduleNumber?: string;
  moduleName?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const buildNavigation = (compteursAchats: CompteursBadges): NavSection[] => [
  {
    title: "PILOTAGE",
    items: [
      { label: "Tableau de bord", href: "/", icon: LayoutDashboard, moduleNumber: "M10", moduleName: "Pilotage" },
      { label: "Notifications", href: "/notifications", icon: Bell, badge: 1, moduleNumber: "M10", moduleName: "Pilotage" },
      { label: "Calendrier RH", href: "/calendrier", icon: Calendar, moduleNumber: "M10", moduleName: "Pilotage" },
    ],
  },
  {
    title: "PERSONNEL",
    items: [
      { label: "Employés", href: "/employes", icon: Users, moduleNumber: "M2", moduleName: "Employés" },
      { label: "Organigramme", href: "/organisation/organigramme", icon: Building2, moduleNumber: "M1", moduleName: "Organisation" },
      { label: "Services & Équipes", href: "/organisation/services", icon: Briefcase, moduleNumber: "M1", moduleName: "Organisation" },
      { label: "Contrats", href: "/contrats", icon: FileText, moduleNumber: "M2", moduleName: "Employés" },
    ],
  },
  {
    title: "TEMPS & ABSENCES",
    items: [
      { label: "Congés & Permissions", href: "/conges", icon: Clock, badge: 3, moduleNumber: "M3", moduleName: "Congés" },
      { label: "Planning chantier", href: "/planning", icon: Calendar, badge: 2, moduleNumber: "M5", moduleName: "Projets" },
      { label: "Relevés d'activité", href: "/releves", icon: ClipboardList, moduleNumber: "M6", moduleName: "Relevés d'activité" },
      { label: "Présences bureau", href: "/presences", icon: CheckSquare, moduleNumber: "M12", moduleName: "Présences bureau" },
    ],
  },
  {
    title: "TECHNIQUE",
    items: [
      { label: "Projets", href: "/projets", icon: FolderKanban, moduleNumber: "M5", moduleName: "Projets" },
      { label: "Appels d'offres", href: "/appels-offres", icon: Lightbulb, moduleNumber: "M9", moduleName: "Appels d'offres" },
      { label: "Ressources", href: "/ressources", icon: PackageSearch, moduleNumber: "M8", moduleName: "Ressources" },
    ],
  },
  {
    title: "ACHATS",
    items: [
      { label: "Mes demandes", href: "/achats/demandes", icon: ShoppingCart, moduleNumber: "M14", moduleName: "Achats" },
      { label: "À valider", href: "/achats/a-valider", icon: CheckSquare, badge: compteursAchats.aValider, moduleNumber: "M14", moduleName: "Achats" },
      { label: "À instruire", href: "/achats/instruction", icon: ClipboardList, badge: compteursAchats.aInstruire, moduleNumber: "M14", moduleName: "Achats" },
      { label: "Bons de commande", href: "/achats/commandes", icon: FileText, badge: compteursAchats.commandes, moduleNumber: "M14", moduleName: "Achats" },
      { label: "Réceptions", href: "/achats/receptions", icon: PackageSearch, badge: compteursAchats.receptions, moduleNumber: "M14", moduleName: "Achats" },
      { label: "Facturation", href: "/achats/facturation", icon: DollarSign, badge: compteursAchats.factures, moduleNumber: "M14", moduleName: "Achats" },
      { label: "Suivi commandes", href: "/achats/suivi", icon: BarChart3, moduleNumber: "M14", moduleName: "Achats" },
      { label: "Bordereau de prix", href: "/achats/articles", icon: Briefcase, moduleNumber: "M14", moduleName: "Achats" },
      { label: "Fournisseurs", href: "/achats/fournisseurs", icon: Building2, moduleNumber: "M14", moduleName: "Achats" },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { label: "Documents", href: "/documents", icon: FileStack, moduleNumber: "M2", moduleName: "Employés" },
      { label: "Paie & Rémunération", href: "/paie", icon: DollarSign, badge: 3, moduleNumber: "M4", moduleName: "Rémunération" },
      { label: "Annonces", href: "/annonces", icon: Megaphone, moduleNumber: "M10", moduleName: "Pilotage" },
      { label: "Rapports", href: "/rapports", icon: BarChart3, moduleNumber: "M10", moduleName: "Pilotage" },
    ],
  },
];

const bottomNav: NavItem[] = [
  { label: "Utilisateurs", href: "/admin/utilisateurs", icon: UserCog, moduleNumber: "M11", moduleName: "Administration" },
  { label: "Journal d'audit", href: "/admin/journal", icon: ScrollText, moduleNumber: "M11", moduleName: "Administration" },
  { label: "Paramètres", href: "/parametres", icon: Settings, moduleNumber: "M0", moduleName: "Socle" },
  { label: "Aide", href: "/aide", icon: HelpCircle, moduleNumber: "M0", moduleName: "Socle" },
];

interface CompteursBadges {
  aValider: number;
  aInstruire: number;
  commandes: number;
  receptions: number;
  factures: number;
}

interface BarreLateraleClientProps {
  userPermissions: string[];
  compteursAchats: CompteursBadges;
}

export function BarreLateraleClient({ userPermissions, compteursAchats }: BarreLateraleClientProps) {
  const pathname = usePathname();

  // Construire la navigation avec les compteurs dynamiques
  const navigation = buildNavigation(compteursAchats);

  // Filtrer les sections en fonction des permissions
  const filteredNavigation = navigation.map((section) => ({
    ...section,
    items: section.items.filter((item) => hasAccessToRoute(item.href, userPermissions)),
  })).filter((section) => section.items.length > 0);

  const filteredBottomNav = bottomNav.filter((item) => hasAccessToRoute(item.href, userPermissions));

  return (
    <TooltipProvider>
      <aside className="flex w-64 flex-col border-r bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
            ITA
          </div>
          <div>
            <div className="text-sm font-semibold">ITA SARL</div>
            <div className="text-xs text-muted-foreground">
              Ressources Humaines
            </div>
          </div>
        </div>

        {/* Navigation principale */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {filteredNavigation.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-blue-50 font-medium text-blue-700"
                            : "text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden="true" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant="default"
                            className="size-5 items-center justify-center rounded-full bg-green-600 p-0 text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                        {item.moduleNumber && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-gray-400">
                                {item.moduleNumber}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-xs">
                                Module {item.moduleNumber} — {item.moduleName}.
                                <br />
                                Non encore livré ; l'entrée reste visible pour que
                                <br />
                                la navigation soit stable.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Navigation inférieure */}
        <div className="border-t p-3">
          <ul className="space-y-1">
            {filteredBottomNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-blue-50 font-medium text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    {item.moduleNumber && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-gray-400">
                            {item.moduleNumber}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="text-xs">
                            Module {item.moduleNumber} — {item.moduleName}.
                            <br />
                            Non encore livré ; l'entrée reste visible pour que
                            <br />
                            la navigation soit stable.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </TooltipProvider>
  );
}
