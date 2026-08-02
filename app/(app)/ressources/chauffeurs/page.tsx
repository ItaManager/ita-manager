import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export default async function PageChauffeurs() {
  await exigerPermission(PERMISSIONS["materiel:lire"].code);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chauffeurs</h1>
          <p className="text-muted-foreground mt-2">
            Liste des employés qualifiés pour la conduite de véhicules
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <div className="rounded-md border border-border p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Fonctionnalité à venir
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            La gestion des chauffeurs sera disponible après l'implémentation du
            module M2 (Employés). Cette fonctionnalité permettra de consulter
            la liste des employés qualifiés pour conduire les véhicules de
            l'entreprise.
          </p>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p>Fonctionnalités prévues :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Liste des chauffeurs avec statut du permis</li>
              <li>Historique des affectations de véhicules</li>
              <li>Gestion des visites médicales obligatoires</li>
              <li>Suivi des formations à la conduite</li>
            </ul>
          </div>
        </div>
      </Suspense>
    </div>
  );
}
