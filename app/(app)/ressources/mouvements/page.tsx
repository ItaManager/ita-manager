import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { listerBonsMouvement } from "@/lib/actions/stock";
import { TableauBonsMouvement } from "../_components/tableau-bons-mouvement";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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

  const result = await listerBonsMouvement(page);
  const { bons, total, pages } = result;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bons de mouvement</h1>
          <p className="text-muted-foreground mt-2">
            {total} bon{total > 1 ? "s" : ""} de mouvement
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau bon
        </Button>
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
