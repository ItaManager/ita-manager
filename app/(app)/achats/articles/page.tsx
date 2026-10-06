import { listerPrixFournisseur } from "@/lib/actions/achats";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { BordereauWrapper } from "./_components/bordereau-wrapper";
import { Suspense } from "react";

export default async function PageBordereauPrix() {
  await verifierAccesPage("/achats/articles");
  const prix = await listerPrixFournisseur();

  // Convertir les Decimal en number pour le client
  const prixSerializables = prix.map((p) => ({
    ...p,
    prixHT: Number(p.prixHT),
  }));

  return (
    <ModuleLayout
      titre="Bordereau de prix"
      description="Référentiel des articles, unités et prix fournisseurs"
      helpText="Gérez les prix fournisseurs pour chaque article du catalogue. Utilisez la recherche pour filtrer rapidement ou exportez en Excel pour vos analyses."
    >
      <Suspense fallback={<div>Chargement...</div>}>
        <BordereauWrapper prix={prixSerializables} />
      </Suspense>
    </ModuleLayout>
  );
}
