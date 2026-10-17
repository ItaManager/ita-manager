import { listerLignesBordereau } from "@/lib/actions/bordereau-prix";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { TableauBordereauSimple } from "./_components/tableau-bordereau-simple";
import { Suspense } from "react";

export default async function PageBordereauPrixSimple() {
  await verifierAccesPage("/achats/bordereau-prix-simple");
  const lignes = await listerLignesBordereau();

  // Convertir Decimal en number
  const lignesSerializables = (lignes as any[]).map((l: any) => ({
    ...l,
    quantite: Number(l.quantite),
    prixUnitaire: Number(l.prixUnitaire),
    creeLe: l.creeLe.toISOString(),
    majLe: l.majLe.toISOString(),
  }));

  return (
    <ModuleLayout
      titre="Bordereau de Prix Simple"
      description="Tableau des lots et prix unitaires"
      helpText="Ajoutez et gérez les lignes du bordereau de prix par lot."
    >
      <Suspense fallback={<div>Chargement...</div>}>
        <TableauBordereauSimple lignes={lignesSerializables} />
      </Suspense>
    </ModuleLayout>
  );
}
