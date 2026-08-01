import { verifierAccesPage } from "@/lib/auth/page-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, DollarSign, FileText, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Pilotage — ITA Manager",
};

export default async function RapportsPage() {
  await verifierAccesPage("/rapports");

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="size-6" />
          Pilotage
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tableaux de bord et indicateurs de performance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:border-primary transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-5" />
              Projets actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">--</p>
            <p className="text-sm text-muted-foreground mt-1">
              Chantiers en cours
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-5" />
              Effectifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">--</p>
            <p className="text-sm text-muted-foreground mt-1">
              Employés actifs
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="size-5" />
              Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">--</p>
            <p className="text-sm text-muted-foreground mt-1">
              Masse salariale mensuelle
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-5" />
              Congés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">--</p>
            <p className="text-sm text-muted-foreground mt-1">
              Demandes en attente
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">--</p>
            <p className="text-sm text-muted-foreground mt-1">
              Points d'attention
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-5" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">--</p>
            <p className="text-sm text-muted-foreground mt-1">
              Expirations à venir
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-info bg-info-soft/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Tableau de bord en développement :</strong> Les indicateurs seront calculés automatiquement à partir des données métier.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
