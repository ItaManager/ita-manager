import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { prisma } from "@/lib/db/prisma";
import { RegistreMateriel } from "./_components/registre-materiel";
import { FormNouveauMateriel } from "./_components/form-nouveau-materiel";

export const metadata = {
  title: "Registre Matériel — ITA Manager",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function RessourcesPage(props: {
  searchParams: SearchParams;
}) {
  await verifierAccesPage("/ressources");

  const searchParams = await props.searchParams;
  const page = parseInt((searchParams.page as string) || "1");
  const recherche = (searchParams.q as string) || "";

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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Registre Matériel
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Parc matériel · Échéances · Affectations
          </p>
        </div>

        <FormNouveauMateriel familles={familles} lieux={lieux} />
      </div>

      <Suspense
        key={`${page}-${recherche}`}
        fallback={
          <div className="rounded-md border p-12 text-center">
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        }
      >
        <RegistreMateriel page={page} recherche={recherche} />
      </Suspense>
    </div>
  );
}
