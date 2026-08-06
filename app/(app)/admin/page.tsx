import { verifierAccesPage } from "@/lib/auth/page-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, Users, Settings, Bell } from "lucide-react";
import Link from "next/link";
import { DashboardStats } from "./_components/dashboard-stats";

export const metadata = {
  title: "Administration — ITA Manager",
};

export default async function AdminPage() {
  await verifierAccesPage("/admin/journal");

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Shield className="size-6" />
          Administration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Outils d'administration système réservés aux administrateurs
        </p>
      </div>

      {/* Dashboard avec statistiques */}
      <div className="mb-8">
        <DashboardStats />
      </div>

      {/* Navigation rapide */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-4">Outils d'administration</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/journal">
          <Card className="cursor-pointer hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="size-5" />
                Journal d'événements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Traçabilité complète des actions et décisions dans l'application
              </p>
              <ul className="mt-3 text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Modifications des données</li>
                <li>Validations et refus</li>
                <li>Connexions et déconnexions</li>
                <li>Recherche par entité ou auteur</li>
              </ul>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/utilisateurs">
          <Card className="cursor-pointer hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="size-5" />
                Gestion des utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Administration des comptes et des rôles applicatifs
              </p>
              <ul className="mt-3 text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Liste des profils</li>
                <li>Attribution des rôles</li>
                <li>Désactivation de comptes</li>
                <li>Réinitialisation MFA</li>
              </ul>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/roles">
          <Card className="cursor-pointer hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="size-5" />
                Rôles & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gestion des rôles et attribution des permissions
              </p>
              <ul className="mt-3 text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Liste des rôles</li>
                <li>Création de rôles personnalisés</li>
                <li>Attribution de permissions</li>
                <li>Protection des rôles système</li>
              </ul>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/alertes">
          <Card className="cursor-pointer hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="size-5" />
                Alertes Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configuration des notifications automatiques
              </p>
              <ul className="mt-3 text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Contrats expirant</li>
                <li>Demandes en attente</li>
                <li>Erreurs système</li>
                <li>Documents administratifs</li>
              </ul>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/parametres">
          <Card className="cursor-pointer hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="size-5" />
                Paramètres système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configuration globale de l'application
              </p>
              <ul className="mt-3 text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Paramètres par domaine</li>
                <li>Modification avec journalisation</li>
                <li>Paramètres verrouillés</li>
                <li>Types typés (NUMBER, STRING, JSON)</li>
              </ul>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="mt-6 border-destructive bg-destructive/10">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>⚠️ Zone réservée :</strong> Les outils d'administration permettent de modifier des données sensibles.
            Toutes les actions sont enregistrées dans le journal d'événements avec votre identité.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
