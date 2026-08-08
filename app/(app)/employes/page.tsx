import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";
import { ListeEmployes } from "./_components/liste-employes";
import { obtenirDonneesReferenceEmploye, obtenirTachesEmployes } from "@/lib/actions/employes";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursEmployes } from "./_components/indicateurs-employes";
import { TitreTaches } from "./_components/titre-taches";
import { ListeTaches } from "./_components/liste-taches";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PageEmployesProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    recherche?: string;
    directionId?: string;
    serviceId?: string;
    statutDossier?: "COMPLET" | "INCOMPLET";
    typeContrat?: "CDI" | "CDD" | "STAGE";
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

  // Charger toutes les données en parallèle
  const [donneesReference, resultTaches] = await Promise.all([
    obtenirDonneesReferenceEmploye(),
    obtenirTachesEmployes("PERMANENT"),
  ]);

  const taches = resultTaches.success ? resultTaches.data : [];

  return (
    <ModuleLayout
      titre="Employés"
      description="Gérez vos employés permanents (CDI/CDD)"
      helpText="Les employés permanents (CDI/CDD) sont rattachés à un poste dans l'organigramme et disposent d'un compte d'accès ITA Manager."
    >
      {/* Indicateurs */}
      <Suspense fallback={<div className="text-center py-4">Chargement indicateurs...</div>}>
        <IndicateursEmployes typeMainOeuvre="PERMANENT" />
      </Suspense>

      {/* Tâches */}
      <Accordion type="single" collapsible defaultValue="taches" className="bg-white rounded-xl border border-[#0000001a]">
        <AccordionItem value="taches" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <Suspense fallback={<h2 className="text-lg font-semibold text-[#18181a]">Vos tâches</h2>}>
              <TitreTaches count={taches.length} />
            </Suspense>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <ListeTaches taches={taches} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-[#0000001a] p-6">
        <Suspense fallback={<div className="text-center py-8">Chargement du tableau...</div>}>
          <ListeEmployes
            page={page}
            limit={limit}
            recherche={params.recherche}
            directionId={params.directionId}
            serviceId={params.serviceId}
            typeMainOeuvre="PERMANENT"
            statutDossier={params.statutDossier}
            typeContrat={params.typeContrat}
            donneesReference={donneesReference}
            tab="permanents"
          />
        </Suspense>
      </div>
    </ModuleLayout>
  );
}
