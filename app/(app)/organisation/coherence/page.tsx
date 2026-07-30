import { Suspense } from "react";
import { ControlesCoherence } from "./_components/controles-coherence";
import { SqueletteCoherence } from "./_components/squelette-coherence";
import { verifierAccesPage } from "@/lib/auth/page-access";

export const metadata = {
  title: "Contrôle de cohérence — ITA Manager",
};

export default async function PageCoherence() {
  await verifierAccesPage("/organisation/coherence");
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Contrôle de cohérence
        </h1>
        <p className="text-sm text-muted-foreground">
          Vérifications automatiques de la structure organisationnelle
        </p>
      </div>

      <Suspense fallback={<SqueletteCoherence />}>
        <ControlesCoherence />
      </Suspense>
    </div>
  );
}
