import { listerDemandesAvecCalculs } from "@/lib/actions/achats";
import { TableauSuivi } from "./_components/tableau-suivi";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { Suspense } from "react";

export default async function PageSuiviAchats() {
  await verifierAccesPage("/achats/suivi");
  const demandes = await listerDemandesAvecCalculs();

  return (
    <ModuleLayout
      titre="Suivi des demandes d'achat"
      description="Vue d'ensemble du circuit de validation et des délais"
      helpText="Suivez l'avancement de toutes les demandes d'achat en temps réel. Les délais sont calculés automatiquement à partir des événements de validation."
    >
      <Suspense fallback={<div>Chargement...</div>}>
        <TableauSuivi demandes={demandes} />
      </Suspense>
    </ModuleLayout>
  );
}
