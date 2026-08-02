import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { Button } from "@/components/ui/button";
import { Truck, Plus } from "lucide-react";

export default async function PageTransport() {
  await exigerPermission(PERMISSIONS["transport:demander"].code);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Demandes de transport</h1>
          <p className="text-muted-foreground mt-2">
            Gestion des demandes de transport de matériel et de personnel
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Button>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <div className="rounded-md border border-border p-12 text-center">
          <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Fonctionnalité à venir
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Le module de gestion des demandes de transport sera disponible
            prochainement. Il permettra de planifier et suivre les déplacements
            de matériel et de personnel entre les différents sites.
          </p>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p>Fonctionnalités prévues :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Création de demandes de transport (matériel/personnel)</li>
              <li>Affectation automatique de véhicules et chauffeurs</li>
              <li>Suivi en temps réel des déplacements</li>
              <li>Historique des trajets et consommation carburant</li>
              <li>Validation hiérarchique des demandes</li>
            </ul>
          </div>
        </div>
      </Suspense>
    </div>
  );
}
