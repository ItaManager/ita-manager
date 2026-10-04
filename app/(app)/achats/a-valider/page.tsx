import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursAchats } from "../_components/indicateurs-achats";
import { ListeDemandesAValider } from "./_components/liste-demandes-a-valider";

export const metadata = {
  title: "Demandes à valider — ITA Manager",
};

export default async function PageAValider() {
  await verifierAccesPage("/achats/a-valider");

  return (
    <ModuleLayout
      titre="Demandes à valider"
      description="Valider les demandes d'achat de vos subordonnés"
      helpText="En tant que N+1, vous validez les demandes d'achat de vos subordonnés directs. Après votre validation, elles passent au Service Achats pour instruction (consultation fournisseurs, négociation prix)."
      indicateurs={
        <Suspense fallback={<div>Chargement...</div>}>
          <IndicateursAchats />
        </Suspense>
      }
    >
      <Suspense fallback={<div>Chargement...</div>}>
        <ListeDemandesAValider />
      </Suspense>
    </ModuleLayout>
  );
}
