import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function PageReceptions() {
  await exigerPermission(PERMISSIONS["reception:controler"].code);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Réceptions fournisseurs</h1>
          <p className="text-muted-foreground mt-2">
            Contrôler et valider les livraisons
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle réception
        </Button>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <div className="rounded-md border p-8">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">Fonctionnalité en cours de développement</p>
            <p className="text-sm">
              Les réceptions permettent de contrôler les livraisons fournisseurs :
            </p>
            <ul className="text-sm mt-4 space-y-2 max-w-md mx-auto text-left">
              <li>• <strong>Contrôle quantitatif</strong> : Quantités livrées vs commandées</li>
              <li>• <strong>Contrôle qualitatif</strong> : Conformité des articles</li>
              <li>• <strong>3 issues</strong> : CONFORME, AVEC_RESERVE, NON_CONFORME</li>
              <li>• <strong>Validation</strong> : Génère automatiquement les mouvements de stock</li>
            </ul>
          </div>
        </div>
      </Suspense>
    </div>
  );
}
