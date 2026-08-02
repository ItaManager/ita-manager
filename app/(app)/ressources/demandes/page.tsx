import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { Inbox } from "lucide-react";

export default async function PageDemandesRecues() {
  await exigerPermission(PERMISSIONS["ressource:arbitrer"].code);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Demandes reçues</h1>
          <p className="text-muted-foreground mt-2">
            Arbitrage des demandes de ressources matérielles
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <div className="rounded-md border border-border p-12 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Fonctionnalité à venir
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            L'arbitrage des demandes de ressources sera disponible après
            l'implémentation du module M8 (Ressources). Cette fonctionnalité
            permettra de gérer les demandes de matériel et d'équipements pour
            les chantiers.
          </p>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p>Fonctionnalités prévues :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Liste des demandes de ressources en attente</li>
              <li>Arbitrage (accepter/refuser/reporter)</li>
              <li>Affectation de matériel disponible</li>
              <li>Gestion des conflits de disponibilité</li>
            </ul>
          </div>
        </div>
      </Suspense>
    </div>
  );
}
