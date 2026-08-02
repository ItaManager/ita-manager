import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function PageInspections() {
  await exigerPermission(PERMISSIONS["materiel:inspecter"].code);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inspections matériel</h1>
          <p className="text-muted-foreground mt-2">
            Contrôles d'entrée et de sortie des véhicules et engins
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle inspection
        </Button>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <div className="rounded-md border p-8">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">Fonctionnalité en cours de développement</p>
            <p className="text-sm">
              Les inspections permettent de documenter l'état du matériel :
            </p>
            <ul className="text-sm mt-4 space-y-2 max-w-md mx-auto text-left">
              <li>• <strong>ENTREE</strong> : État au retour de mission (km, carburant, anomalies)</li>
              <li>• <strong>SORTIE</strong> : État avant départ (check-list sécurité, documents)</li>
              <li>• <strong>3 grilles</strong> : Physique, Documents, Équipements</li>
              <li>• <strong>Relevé compteur</strong> : Kilométrage ou heures (détection anomalies)</li>
            </ul>
          </div>
        </div>
      </Suspense>
    </div>
  );
}
