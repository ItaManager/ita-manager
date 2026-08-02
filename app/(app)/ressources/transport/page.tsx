import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { listerDemandesTransport } from "@/lib/actions/transport";
import { TableauDemandesTransport } from "./_components/tableau-demandes-transport";
import { BoutonNouvelleDemande } from "./_components/bouton-nouvelle-demande";

type SearchParams = Promise<{
  page?: string;
}>;

export default async function PageTransport({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await exigerPermission(PERMISSIONS["transport:demander"].code);

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const { items, hasNextPage } = await listerDemandesTransport();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Demandes de transport</h1>
          <p className="text-muted-foreground mt-2">
            {items.length} demande{items.length > 1 ? "s" : ""} de transport
          </p>
        </div>
        <BoutonNouvelleDemande />
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <TableauDemandesTransport
          demandes={items}
          hasNextPage={hasNextPage}
          pageActuelle={page}
        />
      </Suspense>
    </div>
  );
}
