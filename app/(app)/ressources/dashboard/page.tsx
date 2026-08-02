import { verifierAccesPage } from "@/lib/auth/page-access";
import {
  Package,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  BarChart3,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Tableau de bord Logistique — ITA Manager",
};

export default async function DashboardLogistiquePage() {
  await verifierAccesPage("/ressources/dashboard");

  const stats = [
    {
      title: "Matériel actif",
      value: "—",
      description: "Véhicules et engins opérationnels",
      icon: Package,
    },
    {
      title: "Alertes pièces",
      value: "—",
      description: "Critiques et hautes urgences",
      icon: AlertTriangle,
    },
    {
      title: "Mouvements du mois",
      value: "—",
      description: "Entrées et sorties de stock",
      icon: FileSpreadsheet,
    },
    {
      title: "Inspections en retard",
      value: "—",
      description: "Contrôles techniques à effectuer",
      icon: Search,
    },
    {
      title: "Stock total",
      value: "—",
      description: "Articles en inventaire",
      icon: BarChart3,
    },
    {
      title: "Bons en attente",
      value: "—",
      description: "Demandes à traiter",
      icon: FileText,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          Tableau de bord
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Vue d'ensemble du module Logistique
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-center">
        <p className="text-sm text-blue-900">
          Statistiques temps réel à venir — Dashboard sera alimenté
          progressivement au fil des livraisons M13 L2 et L3
        </p>
      </div>
    </div>
  );
}
