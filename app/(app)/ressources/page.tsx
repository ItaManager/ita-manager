import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { prisma } from "@/lib/db/prisma";
import { RegistreMateriel } from "./_components/registre-materiel";

export const metadata = {
  title: "Registre Matériel — ITA Manager",
};

interface PageRessourcesProps {
  searchParams: Promise<{
    recherche?: string;
    filtre?: "disponibles" | "en-service" | "en-maintenance" | "hors-service" | "vehicules" | "engins" | "materiel" | "outillage" | "tous";
    page?: string;
    limit?: string;
  }>;
}

export default async function RessourcesPage({
  searchParams,
}: PageRessourcesProps) {
  await verifierAccesPage("/ressources");

  const params = await searchParams;

  // Charger les familles et lieux pour le formulaire
  const familles = await prisma.familleMateriel.findMany({
    where: { actif: true },
    select: {
      id: true,
      code: true,
      libelle: true,
      type: true,
    },
    orderBy: { libelle: "asc" },
  });

  const lieux = await prisma.lieuStockage.findMany({
    where: { actif: true },
    select: {
      id: true,
      libelle: true,
    },
    orderBy: { libelle: "asc" },
  });

  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <RegistreMateriel
        recherche={params.recherche}
        filtre={params.filtre}
        page={params.page ? parseInt(params.page) : 1}
        limit={params.limit ? parseInt(params.limit) : 20}
        familles={familles}
        lieux={lieux}
      />
    </Suspense>
  );
}
