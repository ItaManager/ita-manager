import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { listerBonsMouvement, listerArticlesStock } from "@/lib/actions/stock";
import { listerLieuxActifs } from "@/lib/actions/lieu";
import { TableauBonsMouvement } from "../_components/tableau-bons-mouvement";
import { BoutonNouveauBon } from "./_components/bouton-nouveau-bon";

type SearchParams = Promise<{
  page?: string;
}>;

export default async function PageMouvements({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await exigerPermission(PERMISSIONS["stock:lire"].code);

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const [result, lieuxResult, articlesResult] = await Promise.all([
    listerBonsMouvement(page),
    listerLieuxActifs(),
    listerArticlesStock(1, ""),
  ]);
  const { bons, total, pages } = result;
  const lieux = lieuxResult.lieux;
  const articles = articlesResult.articles;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bons de mouvement</h1>
          <p className="text-muted-foreground mt-2">
            {total} bon{total > 1 ? "s" : ""} de mouvement
          </p>
        </div>
        <BoutonNouveauBon lieux={lieux} articles={articles} />
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <TableauBonsMouvement
          bons={bons}
          total={total}
          pages={pages}
          pageActuelle={page}
        />
      </Suspense>
    </div>
  );
}
