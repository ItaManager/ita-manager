import { Suspense } from "react";
import { exigerPermission } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/lib/auth/guard";
import { listerArticlesStock } from "@/lib/actions/stock";
import { TableauStocks } from "../_components/tableau-stocks";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type SearchParams = Promise<{
  page?: string;
  recherche?: string;
}>;

export default async function PageStocks({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await exigerPermission(PERMISSIONS["stock:lire"].code);

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const recherche = params.recherche;

  const result = await listerArticlesStock(page, recherche);
  const { articles, total, pages } = result;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registre des stocks</h1>
          <p className="text-muted-foreground mt-2">
            {total} article{total > 1 ? "s" : ""} de stock
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel article
        </Button>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <TableauStocks
          articles={articles}
          total={total}
          pages={pages}
          pageActuelle={page}
        />
      </Suspense>
    </div>
  );
}
