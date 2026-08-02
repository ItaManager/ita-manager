import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { listerInspections, listerPointsInspection } from "@/lib/actions/inspection";
import { listerMaterielsActifs } from "@/lib/actions/logistique";
import { listerLieuxActifs } from "@/lib/actions/lieu";
import { TableauInspections } from "../_components/tableau-inspections";
import { BoutonNouvelleInspection } from "./_components/bouton-nouvelle-inspection";

type SearchParams = Promise<{
  page?: string;
}>;

export default async function PageInspections({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await exigerPermission(PERMISSIONS["materiel:inspecter"].code);

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  // Charger les données en parallèle
  const [
    { inspections, total, pages },
    { materiels },
    { lieux },
    { points },
  ] = await Promise.all([
    listerInspections(page),
    listerMaterielsActifs(),
    listerLieuxActifs(),
    listerPointsInspection(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inspections matériel</h1>
          <p className="text-muted-foreground mt-2">
            {total} inspection{total > 1 ? "s" : ""} enregistrée{total > 1 ? "s" : ""}
          </p>
        </div>
        <BoutonNouvelleInspection
          materiels={materiels}
          lieux={lieux}
          pointsInspection={points}
        />
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <TableauInspections
          inspections={inspections}
          total={total}
          pages={pages}
          pageActuelle={page}
        />
      </Suspense>
    </div>
  );
}
