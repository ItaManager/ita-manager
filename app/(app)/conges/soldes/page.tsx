import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { AffichageSoldes } from "./_components/affichage-soldes";

export const metadata = {
  title: "Mes soldes de congé — ITA Manager",
};

export default async function SoldesPage() {
  await verifierAccesPage("/conges/soldes");

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Mes soldes de congé
        </h1>
        <p className="text-sm text-muted-foreground">
          Suivi de vos congés acquis, pris et restants
        </p>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <AffichageSoldes />
      </Suspense>
    </div>
  );
}
