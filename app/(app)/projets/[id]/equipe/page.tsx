import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { obtenirProjet } from "@/lib/actions/projets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Users, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { RoleFonctionnel } from "@prisma/client";
import { ModalAffecterEmploye } from "../../_components/modal-affecter-employe";

interface PageEquipeProps {
  params: Promise<{ id: string }>;
}

const ROLE_LABELS: Record<RoleFonctionnel, string> = {
  CONDUCTEUR: "Conducteur de travaux",
  CHARGE_ETUDES: "Chargé d'études",
  CHEF_CHANTIER: "Chef de chantier",
  CHEF_EQUIPE: "Chef d'équipe",
};

export default async function PageEquipe({ params }: PageEquipeProps) {
  await verifierAccesPage("/projets");
  const { id } = await params;

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      <Suspense fallback={<SqueletteEquipe />}>
        <ContenuEquipe projetId={id} />
      </Suspense>
    </div>
  );
}

async function ContenuEquipe({ projetId }: { projetId: string }) {
  const projet = await obtenirProjet(projetId);

  if (!projet) {
    notFound();
  }

  const affectationsActives = projet.affectations || [];

  return (
    <>
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/projets/${projetId}`}>
              <Button variant="ghost" size="icon" aria-label="Retour au projet">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <Users className="size-8 text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-bold">Équipe du chantier</h1>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {projet.code} — {projet.nom}
              </p>
            </div>
          </div>
        </div>

        <ModalAffecterEmploye projetId={projetId} />
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Employés affectés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affectationsActives.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conducteurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                affectationsActives.filter(
                  (a) => a.roleFonctionnel === "CONDUCTEUR"
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chefs de chantier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                affectationsActives.filter(
                  (a) => a.roleFonctionnel === "CHEF_CHANTIER"
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chefs d'équipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                affectationsActives.filter(
                  (a) => a.roleFonctionnel === "CHEF_EQUIPE"
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des affectations */}
      <Card>
        <CardHeader>
          <CardTitle>Affectations actives</CardTitle>
        </CardHeader>
        <CardContent>
          {affectationsActives.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="size-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                Aucun employé affecté à ce chantier
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Affectez des employés au chantier pour constituer votre équipe.
                <br />
                Les affectations permettent de suivre les rôles fonctionnels sur le
                projet.
              </p>
              <ModalAffecterEmploye projetId={projetId} />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Employé</TableHead>
                    <TableHead>Rôle fonctionnel</TableHead>
                    <TableHead>Date de début</TableHead>
                    <TableHead className="text-right">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affectationsActives.map((affectation) => (
                    <TableRow key={affectation.id}>
                      <TableCell className="font-mono text-sm">
                        {affectation.employe.matricule}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {affectation.employe.prenom} {affectation.employe.nom}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ROLE_LABELS[affectation.roleFonctionnel]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(affectation.dateDebut), "d MMM yyyy", {
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default">Actif</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function SqueletteEquipe() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8" />
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
