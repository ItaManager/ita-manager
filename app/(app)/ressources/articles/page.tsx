import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { listerArticlesStock } from "@/lib/actions/stock";
import { TableauArticles } from "../_components/tableau-articles";
import { BoutonNouvelArticle } from "../_components/bouton-nouvel-article";

type SearchParams = Promise<{
  page?: string;
  recherche?: string;
}>;

export default async function PageArticles({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await exigerPermission(PERMISSIONS["referentiel:creer"].code);

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const recherche = params.recherche;

  const result = await listerArticlesStock(page, recherche);
  const { articles, total, pages } = result as Awaited<ReturnType<typeof listerArticlesStock>>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Articles de stock</h1>
          <p className="text-muted-foreground mt-2">
            {total} article{total > 1 ? "s" : ""} au référentiel
          </p>
        </div>
        <BoutonNouvelArticle />
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <TableauArticles
          articles={articles}
          total={total}
          pages={pages}
          pageActuelle={page}
        />
      </Suspense>
    </div>
  );
}
