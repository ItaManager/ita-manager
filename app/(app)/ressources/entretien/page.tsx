import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { Button } from "@/components/ui/button";
import { Wrench, Plus } from "lucide-react";

export default async function PageEntretien() {
  await exigerPermission(PERMISSIONS["entretien:planifier"].code);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entretien du matériel</h1>
          <p className="text-muted-foreground mt-2">
            Planification et suivi de l'entretien préventif et curatif
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Planifier entretien
        </Button>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <div className="rounded-md border border-border p-12 text-center">
          <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Fonctionnalité à venir
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Le module d'entretien permettra de planifier et suivre toutes les
            opérations de maintenance du parc matériel, en lien avec les
            relevés compteur et les inspections périodiques.
          </p>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p>Fonctionnalités prévues :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Planification automatique selon compteur ou périodicité
              </li>
              <li>
                Alertes préventives (vidange à 5000 km, révision annuelle)
              </li>
              <li>Gestion des interventions (préventif/curatif)</li>
              <li>Suivi des pièces détachées utilisées</li>
              <li>Historique complet par matériel</li>
              <li>Calcul du coût total d'entretien (TCO)</li>
            </ul>
          </div>
        </div>
      </Suspense>
    </div>
  );
}
