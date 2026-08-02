import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function PageMouvements() {
  await exigerPermission(PERMISSIONS["stock:lire"].code);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bons de mouvement</h1>
          <p className="text-muted-foreground mt-2">
            Gérer les entrées, sorties et ajustements de stock
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau bon
        </Button>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <div className="rounded-md border p-8">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">Fonctionnalité en cours de développement</p>
            <p className="text-sm">
              Les bons de mouvement permettront de tracer toutes les opérations de stock :
            </p>
            <ul className="text-sm mt-4 space-y-2 max-w-md mx-auto text-left">
              <li>• <strong>ENTREE</strong> : Réceptions fournisseurs, retours chantier</li>
              <li>• <strong>SORTIE</strong> : Affectations chantier, consommations</li>
              <li>• <strong>AJUSTEMENT</strong> : Corrections après inventaire</li>
            </ul>
          </div>
        </div>
      </Suspense>
    </div>
  );
}
