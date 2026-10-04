import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursAchats } from "../_components/indicateurs-achats";
import { ListeDemandesAInstruire } from "./_components/liste-demandes-a-instruire";

export const metadata = {
  title: "Instruction des demandes — ITA Manager",
};

export default async function PageInstruction() {
  await verifierAccesPage("/achats/instruction");

  return (
    <ModuleLayout
      titre="Instruction des demandes"
      description="Instruire les demandes validées par les N+1"
      helpText="Le Service Achats instruit les demandes validées par les N+1 : consultation de fournisseurs, négociation des prix, sélection du meilleur offrant selon les critères (prix, délai, qualité). Une fois instruite, la demande peut passer à l'émission du bon de commande."
      indicateurs={
        <Suspense fallback={<div>Chargement...</div>}>
          <IndicateursAchats />
        </Suspense>
      }
    >
      <Suspense fallback={<div>Chargement...</div>}>
        <ListeDemandesAInstruire />
      </Suspense>
    </ModuleLayout>
  );
}
