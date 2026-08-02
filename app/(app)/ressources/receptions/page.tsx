import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { listerReceptions } from "@/lib/actions/reception";
import { TableauReceptions } from "../_components/tableau-receptions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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

  const result = await listerReceptions(page);
  const { receptions, total, pages } = result;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Réceptions fournisseurs</h1>
          <p className="text-muted-foreground mt-2">
            {total} réception{total > 1 ? "s" : ""} enregistrée{total > 1 ? "s" : ""}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle réception
        </Button>
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
