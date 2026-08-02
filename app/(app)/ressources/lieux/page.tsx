import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { listerLieux } from "@/lib/actions/lieu";
import { TableauLieux } from "../_components/tableau-lieux";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type SearchParams = Promise<{
  page?: string;
}>;

export default async function PageLieux({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await exigerPermission(PERMISSIONS["materiel:lire"].code);

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const result = await listerLieux(page);
  const { lieux, total, pages } = result;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lieux de stockage</h1>
          <p className="text-muted-foreground mt-2">
            {total} lieu{total > 1 ? "x" : ""} de stockage
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau lieu
        </Button>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <TableauLieux
          lieux={lieux}
          total={total}
          pages={pages}
          pageActuelle={page}
        />
      </Suspense>
    </div>
  );
}
