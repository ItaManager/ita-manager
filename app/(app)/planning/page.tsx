import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { Calendar } from "lucide-react";
import { ListePeriodesPaie } from "./_components/liste-periodes-paie";

export const metadata = {
  title: "Paie Chantier — ITA Manager",
};

export default async function PlanningPage() {
  await verifierAccesPage("/planning");

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Calendar className="size-6" />
            Paie Chantier
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion des périodes de paie par projet
          </p>
        </div>

        {/* TODO: Bouton nouvelle période */}
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <ListePeriodesPaie />
      </Suspense>
    </div>
  );
}
