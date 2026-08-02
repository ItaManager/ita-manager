import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { listerInspections } from "@/lib/actions/inspection";
import { TableauInspections } from "../_components/tableau-inspections";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type SearchParams = Promise<{
  page?: string;
}>;

export default async function PageInspections({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await exigerPermission(PERMISSIONS["materiel:inspecter"].code);

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const result = await listerInspections(page);
  const { inspections, total, pages } = result;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inspections matériel</h1>
          <p className="text-muted-foreground mt-2">
            {total} inspection{total > 1 ? "s" : ""} enregistrée{total > 1 ? "s" : ""}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle inspection
        </Button>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <TableauInspections
          inspections={inspections}
          total={total}
          pages={pages}
          pageActuelle={page}
        />
      </Suspense>
    </div>
  );
}
