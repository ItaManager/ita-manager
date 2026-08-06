import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { listerReceptions } from "@/lib/actions/reception";
import { listerArticlesStock } from "@/lib/actions/stock";
import { TableauReceptions } from "../_components/tableau-receptions";
import { BoutonNouvelleReception } from "./_components/bouton-nouvelle-reception";

type SearchParams = Promise<{
  page?: string;
}>;

export default async function PageReceptions({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await exigerPermission(PERMISSIONS["reception:controler"].code);

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const [receptionsResult, articlesResult] = await Promise.all([
    listerReceptions(page),
    listerArticlesStock(1),
  ]);

  const { receptions, total, pages } = receptionsResult;
  const { articles } = articlesResult;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Réceptions fournisseurs</h1>
          <p className="text-muted-foreground mt-2">
            {total} réception{total > 1 ? "s" : ""} enregistrée{total > 1 ? "s" : ""}
          </p>
        </div>
        <BoutonNouvelleReception articles={articles} />
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <TableauReceptions
          receptions={receptions}
          total={total}
          pages={pages}
          pageActuelle={page}
        />
      </Suspense>
    </div>
  );
}
