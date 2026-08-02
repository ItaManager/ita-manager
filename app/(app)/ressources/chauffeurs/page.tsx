import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { listerEmployes } from "@/lib/actions/employes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, User, Car } from "lucide-react";
import Link from "next/link";

async function TableauChauffeurs() {
  // Lister tous les employés permanents actifs
  const { items } = await listerEmployes({
    typeMainOeuvre: "PERMANENT",
  });

  return (
    <div className="space-y-4">
      {/* Alerte explicative */}
      <div className="rounded-md bg-warning-soft dark:bg-warning border border-warning/20 dark:border-warning p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-warning dark:text-warning mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="font-semibold text-warning dark:text-warning-soft">
              Écran en développement — Champs permis non disponibles
            </h3>
            <p className="text-sm text-warning dark:text-warning-soft">
              Les informations de permis de conduire et visite médicale seront
              disponibles après extension du modèle Employe (M2).
            </p>
            <div className="text-sm text-warning dark:text-warning space-y-1">
              <p className="font-medium">Champs à ajouter au modèle Employe :</p>
              <ul className="list-disc list-inside ml-2 space-y-0.5">
                <li>
                  <strong>Permis :</strong> type (A, B, C, D, E), numéro, date
                  délivrance, date expiration
                </li>
                <li>
                  <strong>Visite médicale :</strong> date visite, date expiration,
                  aptitude
                </li>
              </ul>
              <p className="mt-2">
                En attendant, cette page affiche tous les employés permanents avec
                leurs affectations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des employés permanents */}
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matricule</TableHead>
              <TableHead>Nom complet</TableHead>
              <TableHead>Affectation actuelle</TableHead>
              <TableHead>Permis</TableHead>
              <TableHead>Validité permis</TableHead>
              <TableHead>Visite médicale</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Aucun employé permanent trouvé
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              items.map((employe) => (
                <TableRow key={employe.id}>
                  <TableCell>
                    <Link
                      href={`/employes/${employe.id}`}
                      className="font-mono text-sm hover:underline"
                    >
                      {employe.matricule}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {employe.nom} {employe.prenom}
                      </div>
                      {employe.email && (
                        <div className="text-sm text-muted-foreground">
                          {employe.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {employe.posteActuel ? (
                      <div>
                        <div className="font-medium">
                          {employe.posteActuel.libelle}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {employe.posteActuel.service?.libelle ??
                            employe.posteActuel.direction.libelle}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">
                        Non affecté
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <Car className="h-3 w-3" />
                      <span className="text-muted-foreground">
                        Données non disponibles
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">—</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">—</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer explicatif */}
      <div className="text-sm text-muted-foreground text-center">
        <p>
          Une fois les champs permis ajoutés, cette page affichera uniquement les
          employés avec permis valide et affectations véhicules actives.
        </p>
      </div>
    </div>
  );
}

export default async function PageChauffeurs() {
  await exigerPermission(PERMISSIONS["materiel:lire"].code);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chauffeurs</h1>
          <p className="text-muted-foreground mt-2">
            Employés qualifiés pour la conduite de véhicules (en développement)
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="rounded-md border border-border p-12 text-center">
            <div className="animate-pulse">
              <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          </div>
        }
      >
        <TableauChauffeurs />
      </Suspense>
    </div>
  );
}
