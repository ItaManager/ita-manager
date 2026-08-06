import { verifierAccesPage } from "@/lib/auth/page-access";
import { obtenirStatistiquesLogistique } from "@/lib/actions/logistique";
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

  // Récupérer les statistiques réelles
  const statistiques = await obtenirStatistiquesLogistique();

  const stats = [
    {
      title: "Matériel actif",
      value: statistiques.totalMaterielActif.toString(),
      description: "Véhicules et engins opérationnels",
      icon: Package,
    },
    {
      title: "Alertes pièces",
      value: statistiques.alertesPieces.critiques > 0 || statistiques.alertesPieces.hautes > 0
        ? `${statistiques.alertesPieces.critiques} critiques, ${statistiques.alertesPieces.hautes} hautes`
        : "0",
      description: "Pièces administratives périmées ou à renouveler",
      icon: AlertTriangle,
    },
    {
      title: "Mouvements du mois",
      value: statistiques.mouvementsMois.toString(),
      description: "Entrées et sorties de stock",
      icon: FileSpreadsheet,
    },
    {
      title: "Inspections en retard",
      value: statistiques.inspectionsEnRetard.toString(),
      description: "Contrôles avec réserves ou non conformes",
      icon: Search,
    },
    {
      title: "Stock total",
      value: statistiques.stockTotal.toString(),
      description: "Articles en inventaire",
      icon: BarChart3,
    },
    {
      title: "Bons en attente",
      value: statistiques.bonsEnAttente.toString(),
      description: "Créés dans les 7 derniers jours, non validés",
      icon: FileText,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">
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
                <div className="text-2xl font-semibold text-foreground">
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
    </div>
  );
}
