import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursConges } from "./_components/indicateurs-conges";
import { ListeConges } from "./_components/liste-conges";
import { ListeTaches } from "./_components/liste-taches";
import { TitreTaches } from "./_components/titre-taches";

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
  const vue = params.vue || "mes-demandes";

  return (
    <ModuleLayout
      titre="Congés et permissions"
      description="Gérez vos demandes de congés, permissions et absences"
      helpText="Suivez vos soldes de congés, créez des demandes, consultez le calendrier de l'équipe et validez les demandes selon votre rôle. Circuit de validation à 2 niveaux : validation N+1 puis contrôle RH."
      indicateurs={
        <Suspense fallback={<div>Chargement...</div>}>
          <IndicateursConges vue={vue} />
        </Suspense>
      }
      taches={{
        titre: (
          <Suspense fallback={<h2 className="text-lg font-semibold text-[#18181a]">Vos tâches</h2>}>
            <TitreTaches />
          </Suspense>
        ),
        contenu: (
          <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement...</div>}>
            <ListeTaches />
          </Suspense>
        ),
      }}
    >
      <Suspense fallback={<div>Chargement...</div>}>
        <ListeConges
          recherche={params.recherche}
          statut={params.statut}
          type={params.type}
          dateDebut={params.dateDebut}
          dateFin={params.dateFin}
          vue={vue}
          page={params.page ? parseInt(params.page) : 1}
          limit={params.limit ? parseInt(params.limit) : 20}
        />
      </Suspense>
    </ModuleLayout>
  );
}
