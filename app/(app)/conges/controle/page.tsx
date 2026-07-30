import { Suspense } from "react";
import { ListeDemandesRH } from "./_components/liste-demandes-rh";
import { verifierAccesPage } from "@/lib/auth/page-access";

export const metadata = {
  title: "Contrôle RH — ITA Manager",
};

export default async function ControleRHPage() {
  await verifierAccesPage("/conges/controle");

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Contrôle RH des absences
        </h1>
        <p className="text-sm text-muted-foreground">
          Demandes validées par le supérieur, en attente de contrôle RH
        </p>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <ListeDemandesRH />
      </Suspense>
    </div>
  );
}
