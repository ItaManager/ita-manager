import { Suspense } from "react";
import { ListeDemandes } from "./_components/liste-demandes";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export const metadata = {
  title: "Mes congés — ITA Manager",
};

export default async function CongesPage() {
  await verifierAccesPage("/conges");

  return (
    <div className="container mx-auto py-8">
      {/* En-tête avec solde — M3 §5.1 */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Mes congés</h1>
        <p className="text-sm text-muted-foreground">
          Demandes d'absence et permissions
        </p>
      </div>

      {/* Solde disponible — placeholder Phase 2, calcul Phase 6 */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary-soft">
            <CalendarDays className="size-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Solde disponible
            </p>
            <p className="text-2xl font-semibold text-foreground">
              — jours
            </p>
            <p className="text-xs text-muted-foreground">
              Calcul en attente (Phase 6)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Liste des demandes */}
      <Suspense fallback={<div>Chargement...</div>}>
        <ListeDemandes />
      </Suspense>
    </div>
  );
}
