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
  Package,
  DollarSign,
  Megaphone,
  BarChart3,
  UserCog,
  ScrollText,
  Settings,
  HelpCircle,
  ShoppingCart,
  UserCheck,
  History,
  Inbox,
  Send,
  FileCheck,
  TrendingUp,
  Shield,
  Award,
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

const buildNavigation = (compteursAchats: CompteursBadges, compteursConges: CompteursConges): NavSection[] => [
  {
    title: "MON ESPACE",
    items: [
      { label: "Congés et permissions", href: "/conges-permissions", icon: Calendar, moduleNumber: "M3", moduleName: "Congés" },
      { label: "Mes documents", href: "/documents", icon: FileStack, moduleNumber: "M2", moduleName: "Employés" },
    ],
  },
  {
    title: "PILOTAGE",
    items: [
      { label: "Tableau de bord", href: "/", icon: LayoutDashboard, moduleNumber: "M10", moduleName: "Pilotage" },
      { label: "Calendrier RH", href: "/calendrier", icon: Calendar, moduleNumber: "M10", moduleName: "Pilotage" },
    ],
  },
  {
    title: "PERSONNEL",
    items: [
      { label: "Employés", href: "/employes", icon: Users, moduleNumber: "M2", moduleName: "Employés" },
      { label: "Journaliers", href: "/journaliers", icon: Users, moduleNumber: "M2", moduleName: "Employés" },
      { label: "Contrats", href: "/contrats", icon: FileText, moduleNumber: "M2", moduleName: "Employés" },
      { label: "Compétences", href: "/personnel/competences", icon: Award, moduleNumber: "M17", moduleName: "Compétences" },
      { label: "Assignations", href: "/personnel/competences/agents", icon: UserCog, moduleNumber: "M17", moduleName: "Compétences" },
    ],
  },
  {
    title: "TECHNIQUE",
    items: [
      { label: "Projets", href: "/projets", icon: FolderKanban, moduleNumber: "M5", moduleName: "Projets" },
      { label: "Planning chantier", href: "/planning", icon: Calendar, badge: 2, moduleNumber: "M5", moduleName: "Projets" },
      { label: "Relevés d'activité", href: "/releves", icon: ClipboardList, moduleNumber: "M6", moduleName: "Relevés d'activité" },
      { label: "Appels d'offres", href: "/appels-offres", icon: Lightbulb, moduleNumber: "M9", moduleName: "Appels d'offres" },
      { label: "Logistique", href: "/ressources", icon: PackageSearch, moduleNumber: "M13", moduleName: "Logistique" },
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
    title: "ASSISTANAT",
    items: [
      { label: "Visiteurs", href: "/assistanat/visiteurs", icon: UserCheck, badge: 0, moduleNumber: "M16", moduleName: "Assistanat" },
      { label: "Historique des visites", href: "/assistanat/visiteurs/historique", icon: History, moduleNumber: "M16", moduleName: "Assistanat" },
      { label: "Courrier arrivée", href: "/assistanat/courrier/arrivee", icon: Inbox, moduleNumber: "M16", moduleName: "Assistanat" },
      { label: "Courrier départ", href: "/assistanat/courrier/depart", icon: Send, moduleNumber: "M16", moduleName: "Assistanat" },
      { label: "Courrier à traiter", href: "/assistanat/courrier/a-traiter", icon: FileCheck, badge: 0, moduleNumber: "M16", moduleName: "Assistanat" },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { label: "Paie & Rémunération", href: "/paie", icon: DollarSign, badge: 3, moduleNumber: "M4", moduleName: "Rémunération" },
      { label: "Présences bureau", href: "/presences", icon: CheckSquare, moduleNumber: "M12", moduleName: "Présences bureau" },
      { label: "Annonces", href: "/annonces", icon: Megaphone, moduleNumber: "M10", moduleName: "Pilotage" },
      { label: "Rapports", href: "/rapports", icon: BarChart3, moduleNumber: "M10", moduleName: "Pilotage" },
    ],
  },
];

const bottomNav: NavItem[] = [
  { label: "Utilisateurs", href: "/admin/utilisateurs", icon: UserCog, moduleNumber: "M11", moduleName: "Administration" },
  { label: "Journal d'audit", href: "/admin/journal", icon: ScrollText, moduleNumber: "M11", moduleName: "Administration" },
  { label: "Rôles & Permissions", href: "/admin/roles", icon: Shield, moduleNumber: "M11", moduleName: "Administration" },
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

interface CompteursConges {
  aValiderN1: number;
  controleRH: number;
}

interface BarreLateraleClientProps {
  userPermissions: string[];
  compteursAchats: CompteursBadges;
  compteursConges: CompteursConges;
}

export function BarreLateraleClient({ userPermissions, compteursAchats, compteursConges }: BarreLateraleClientProps) {
  const pathname = usePathname();

  // Construire la navigation avec les compteurs dynamiques
  const navigation = buildNavigation(compteursAchats, compteursConges);

  // Filtrer les sections en fonction des permissions
  const filteredNavigation = navigation.map((section) => ({
    ...section,
    items: section.items.filter((item) => hasAccessToRoute(item.href, userPermissions)),
  })).filter((section) => section.items.length > 0);

  const filteredBottomNav = bottomNav.filter((item) => hasAccessToRoute(item.href, userPermissions));

  return (
    <TooltipProvider>
      <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col z-40">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl text-white" style={{ backgroundColor: '#13850b' }}>
              I
            </div>
            <div>
              <div className="font-semibold text-lg">ITA Manager</div>
              <div className="text-xs text-muted-foreground">
                Ressources Humaines
              </div>
            </div>
          </div>
        </div>

        {/* Navigation principale */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          {filteredNavigation.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="mb-2 px-3 text-xs font-semibold text-[#18181a]/60">
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
                          "flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors cursor-pointer",
                          isActive
                            ? "text-white font-semibold"
                            : "text-[#18181a] hover:bg-muted hover:text-foreground font-medium"
                        )}
                        style={isActive ? { backgroundColor: '#13850b' } : undefined}
                      >
                        <Icon className="size-5 shrink-0" aria-hidden="true" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge ? (
                          <Badge
                            variant="default"
                            className="h-5 min-w-5 items-center justify-center rounded-full p-0 px-1 text-xs text-white"
                            style={{ backgroundColor: '#13850b' }}
                          >
                            {item.badge}
                          </Badge>
                        ) : null}
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
        <div className="border-t border-border p-4 space-y-1">
          {filteredBottomNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors cursor-pointer",
                  isActive
                    ? "text-white font-semibold"
                    : "text-[#18181a] hover:bg-muted hover:text-foreground font-medium"
                )}
                style={isActive ? { backgroundColor: '#13850b' } : undefined}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
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
            );
          })}
        </div>
      </aside>
    </TooltipProvider>
  );
}
