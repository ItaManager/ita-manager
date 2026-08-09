import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursConges } from "./_components/indicateurs-conges";
import { TitreTaches } from "./_components/titre-taches";
import { ListeTaches } from "./_components/liste-taches";
import { ListeConges } from "./_components/liste-conges";
import { obtenirTachesConges } from "@/lib/actions/conges";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PageCongesPermissionsProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    recherche?: string;
    statut?: "EN_ATTENTE" | "APPROUVE_N1" | "VALIDE_RH" | "REFUSE";
    type?: "CONGE_ANNUEL" | "CONGE_MALADIE" | "PERMISSION" | "CONGE_SANS_SOLDE";
    dateDebut?: string;
    dateFin?: string;
    vue?: "mes-demandes" | "a-valider" | "controle-rh" | "equipe";
  }>;
}

export const metadata = {
  title: "Congés et permissions — ITA Manager",
};

export default async function PageCongesPermissions({ searchParams }: PageCongesPermissionsProps) {
  await verifierAccesPage("/conges-permissions");

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 25;
  const vue = params.vue || "mes-demandes";

  // Charger les tâches en parallèle
  const resultTaches = await obtenirTachesConges();
  const taches = resultTaches.success ? resultTaches.data : [];

  return (
    <ModuleLayout
      titre="Congés et permissions"
      description="Gérez vos demandes de congés, permissions et absences"
      helpText="Suivez vos soldes, créez des demandes, consultez le calendrier équipe et validez les demandes de votre équipe."
    >
      {/* Indicateurs */}
      <Suspense fallback={<div className="text-center py-4">Chargement indicateurs...</div>}>
        <IndicateursConges vue={vue} />
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
          <ListeConges
            page={page}
            limit={limit}
            recherche={params.recherche}
            statut={params.statut}
            type={params.type}
            dateDebut={params.dateDebut}
            dateFin={params.dateFin}
            vue={vue}
          />
        </Suspense>
      </div>
    </ModuleLayout>
  );
}
