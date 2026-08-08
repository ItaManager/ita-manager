import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";
import { ListeEmployes } from "../employes/_components/liste-employes";
import { obtenirDonneesReferenceEmploye, obtenirTachesEmployes } from "@/lib/actions/employes";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursEmployes } from "../employes/_components/indicateurs-employes";
import { TitreTaches } from "../employes/_components/titre-taches";
import { ListeTaches } from "../employes/_components/liste-taches";

interface PageJournaliersProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    recherche?: string;
    directionId?: string;
    serviceId?: string;
    statutDossier?: "COMPLET" | "INCOMPLET";
  }>;
}

export const metadata = {
  title: "Journaliers — ITA Manager",
};

export default async function PageJournaliers({ searchParams }: PageJournaliersProps) {
  await verifierAccesPage("/employes");

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 25;

  // Charger toutes les données en parallèle
  const [donneesReference, resultTaches] = await Promise.all([
    obtenirDonneesReferenceEmploye(),
    obtenirTachesEmployes("JOURNALIER"),
  ]);

  const taches = resultTaches.success ? resultTaches.data : [];

  return (
    <ModuleLayout
      titre="Journaliers"
      description="Gérez vos employés journaliers (INTERIM)"
      helpText="Les journaliers sont affectés directement aux chantiers avec des contrats courts. Ils sont rémunérés au jour pointé selon leur compétence et ne disposent pas de compte d'accès ITA Manager."
    >
      {/* Indicateurs */}
      <Suspense fallback={<div className="text-center py-4">Chargement indicateurs...</div>}>
        <IndicateursEmployes typeMainOeuvre="JOURNALIER" />
      </Suspense>

      {/* Tâches */}
      <div className="bg-white rounded-xl border border-[#0000001a]">
        <div className="px-6 py-4 border-b border-[#0000001a]">
          <Suspense fallback={<h2 className="text-lg font-semibold text-[#18181a]">Vos tâches</h2>}>
            <TitreTaches count={taches.length} />
          </Suspense>
        </div>
        <div className="px-6 py-4">
          <ListeTaches taches={taches} />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-[#0000001a] p-6">
        <Suspense fallback={<div className="text-center py-8">Chargement du tableau...</div>}>
          <ListeEmployes
            page={page}
            limit={limit}
            recherche={params.recherche}
            directionId={params.directionId}
            serviceId={params.serviceId}
            typeMainOeuvre="JOURNALIER"
            statutDossier={params.statutDossier}
            donneesReference={donneesReference}
            tab="journaliers"
          />
        </Suspense>
      </div>
    </ModuleLayout>
  );
}
