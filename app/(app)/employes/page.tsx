import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";
import { ListeEmployes } from "./_components/liste-employes";
import { obtenirDonneesReferenceEmploye, obtenirTachesEmployes } from "@/lib/actions/employes";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursEmployes } from "./_components/indicateurs-employes";
import { TitreTaches } from "./_components/titre-taches";
import { ListeTaches } from "./_components/liste-taches";
import { TabsEmployes } from "./_components/tabs-employes";
import type { TypeMainOeuvre } from "@prisma/client";

interface PageEmployesProps {
  searchParams: Promise<{
    tab?: "permanents" | "journaliers";
    page?: string;
    limit?: string;
    recherche?: string;
    directionId?: string;
    serviceId?: string;
    typeMainOeuvre?: TypeMainOeuvre;
    statutDossier?: "COMPLET" | "INCOMPLET";
  }>;
}

export const metadata = {
  title: "Employés — ITA Manager",
};

export default async function PageEmployes({ searchParams }: PageEmployesProps) {
  await verifierAccesPage("/employes");

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 25;
  const tab = params.tab || "permanents"; // Par défaut: permanents

  // Déterminer le type d'employé selon le tab actif
  const typeMainOeuvreActif = tab === "permanents" ? "PERMANENT" : "JOURNALIER";

  // Charger toutes les données en parallèle
  const { prisma } = await import("@/lib/db/prisma");
  const [donneesReference, permanents, journaliers, resultTaches] = await Promise.all([
    obtenirDonneesReferenceEmploye(),
    prisma.employe.count({
      where: { archiveLe: null, typeMainOeuvre: "PERMANENT" },
    }),
    prisma.employe.count({
      where: { archiveLe: null, typeMainOeuvre: "JOURNALIER" },
    }),
    obtenirTachesEmployes(typeMainOeuvreActif), // Filtré par tab
  ]);

  const tabCounts = { permanents, journaliers };
  const taches = resultTaches.success ? resultTaches.data : [];

  return (
    <ModuleLayout
      titre="Employés"
      description="Gérez vos employés permanents et journaliers"
      helpText="Les employés permanents (CDI/CDD) sont rattachés à un poste dans l'organigramme et disposent d'un compte d'accès. Les journaliers (INTERIM) sont affectés directement aux chantiers avec des contrats courts."
    >
      {/* Tabs juste après le titre */}
      <div className="bg-white rounded-xl border border-[#0000001a] p-6">
        <TabsEmployes tab={tab} counts={tabCounts} />
      </div>

      {/* Indicateurs spécifiques au tab */}
      <Suspense fallback={<div className="text-center py-4">Chargement indicateurs...</div>}>
        <IndicateursEmployes typeMainOeuvre={typeMainOeuvreActif as TypeMainOeuvre} />
      </Suspense>

      {/* Tâches spécifiques au tab */}
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

      {/* Tableau spécifique au tab */}
      <div className="bg-white rounded-xl border border-[#0000001a] p-6">
        <Suspense fallback={<div className="text-center py-8">Chargement du tableau...</div>}>
          <ListeEmployes
            page={page}
            limit={limit}
            recherche={params.recherche}
            directionId={params.directionId}
            serviceId={params.serviceId}
            typeMainOeuvre={tab === "permanents" ? "PERMANENT" : "JOURNALIER"}
            statutDossier={params.statutDossier}
            donneesReference={donneesReference}
            tab={tab}
          />
        </Suspense>
      </div>
    </ModuleLayout>
  );
}
