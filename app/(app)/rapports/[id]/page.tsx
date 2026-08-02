import { verifierAccesPage } from "@/lib/auth/page-access";
import { exigerPermission, verifierPermission } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Users, Wrench, Package, AlertTriangle } from "lucide-react";
import { BoutonSoumettre } from "../_components/bouton-soumettre";
import { BoutonValider } from "../_components/bouton-valider";
import { BoutonRefuser } from "../_components/bouton-refuser";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Get status badge variant
 */
function getStatutBadge(statut: string) {
  switch (statut) {
    case "BROUILLON":
      return <Badge variant="outline">Brouillon</Badge>;
    case "SOUMIS":
      return <Badge variant="warning">Soumis</Badge>;
    case "VISE":
      return <Badge variant="success">Visé</Badge>;
    case "REJETE":
      return <Badge variant="destructive">Rejeté</Badge>;
    default:
      return <Badge variant="outline">{statut}</Badge>;
  }
}

/**
 * Activity report detail page
 * M6 — Rapports d'activité
 *
 * 5 sections:
 * - Info générale (project, date, status)
 * - Pointages (worker attendance)
 * - Travaux réalisés (work accomplished)
 * - Matériel/matériaux (equipment/materials)
 * - Incidents
 *
 * Workflow: Submit → Approve/Reject
 * Permission: releve:saisir (view own), releve:viser (approve)
 */
export default async function RapportDetailPage({ params }: PageProps) {
  await verifierAccesPage("/rapports");
  const session = await exigerPermission("releve:saisir");

  const { id } = await params;

  // Check if this is a client-side ID (offline report)
  // Client IDs are UUIDs with dashes, server IDs are CUIDs
  const isOfflineId = id.includes("-");

  if (isOfflineId) {
    // Offline report - render client-side component
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <Card className="border-info bg-info-soft/30">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>Relevé hors ligne :</strong> Ce relevé est stocké localement et sera
              synchronisé avec le serveur dès que la connexion sera rétablie.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Server-synced report
  const rapport = await prisma.releveActivite.findUnique({
    where: { id },
    include: {
      projet: {
        select: {
          code: true,
          nom: true,
        },
      },
      chefChantier: {
        select: {
          nom: true,
          prenom: true,
        },
      },
      conducteurTravaux: {
        select: {
          nom: true,
          prenom: true,
        },
      },
      pointages: {
        include: {
          employe: {
            select: {
              matricule: true,
              nom: true,
              prenom: true,
            },
          },
        },
        orderBy: {
          employe: {
            nom: "asc",
          },
        },
      },
      travauxRealises: {
        include: {
          tache: {
            select: {
              libelle: true,
            },
          },
        },
      },
      utilisationsMateriel: {
        include: {
          materiel: {
            select: {
              designation: true,
              code: true,
            },
          },
        },
      },
      consommations: {
        include: {
          materiau: {
            select: {
              designation: true,
            },
          },
        },
      },
      incidents: true,
    },
  });

  if (!rapport) {
    notFound();
  }

  // Check permissions for workflow actions
  const peutViser = await verifierPermission(session.userId, "releve:viser");

  // Determine which buttons to show
  const peutSoumettre = rapport.statut === "BROUILLON";
  const peutValiderOuRefuser = rapport.statut === "SOUMIS" && peutViser;

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button size="sm" variant="ghost" asChild>
            <Link href="/rapports">
              <ArrowLeft className="size-4 mr-2" aria-hidden="true" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <FileText className="size-6" aria-hidden="true" />
              Relevé d'activité
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(rapport.date).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {peutSoumettre && <BoutonSoumettre clientId={rapport.id} />}
          {peutValiderOuRefuser && (
            <>
              <BoutonValider rapportId={rapport.id} />
              <BoutonRefuser rapportId={rapport.id} />
            </>
          )}
        </div>
      </div>

      {/* Info générale */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Chantier</p>
            <p className="font-medium">
              {rapport.projet.code} — {rapport.projet.nom}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Statut</p>
            {getStatutBadge(rapport.statut)}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Chef de chantier</p>
            <p className="font-medium">
              {rapport.chefChantier.prenom} {rapport.chefChantier.nom}
            </p>
          </div>
          {rapport.conducteurTravaux && (
            <div>
              <p className="text-sm text-muted-foreground">Conducteur de travaux</p>
              <p className="font-medium">
                {rapport.conducteurTravaux.prenom} {rapport.conducteurTravaux.nom}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pointages */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-5" aria-hidden="true" />
            Pointages ({rapport.pointages.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rapport.pointages.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Aucun pointage enregistré</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead className="text-right">H. théoriques</TableHead>
                  <TableHead className="text-right">H. réelles</TableHead>
                  <TableHead className="text-right">H. sup</TableHead>
                  <TableHead>Observation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rapport.pointages.map((pointage) => (
                  <TableRow key={pointage.id}>
                    <TableCell className="font-mono text-sm">
                      {pointage.employe.matricule}
                    </TableCell>
                    <TableCell>
                      {pointage.employe.prenom} {pointage.employe.nom}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={pointage.etat === "PRESENT" ? "success" : "outline"}
                      >
                        {pointage.etat}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {pointage.heuresTheoretiques.toString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {pointage.heuresReelles.toString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {pointage.heuresSup.toString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {pointage.observation || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Travaux réalisés */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="size-5" aria-hidden="true" />
            Travaux réalisés ({rapport.travauxRealises.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rapport.travauxRealises.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Aucun travail enregistré</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tâche</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead>Unité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rapport.travauxRealises.map((travail) => (
                  <TableRow key={travail.id}>
                    <TableCell>{travail.tache?.libelle || "—"}</TableCell>
                    <TableCell>{travail.description}</TableCell>
                    <TableCell className="text-right">
                      {travail.quantite.toString()}
                    </TableCell>
                    <TableCell>{travail.unite}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Matériel et matériaux */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Utilisation matériel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="size-5" aria-hidden="true" />
              Matériel ({rapport.utilisationsMateriel.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rapport.utilisationsMateriel.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun matériel utilisé
              </p>
            ) : (
              <div className="space-y-2">
                {rapport.utilisationsMateriel.map((utilisation) => (
                  <div key={utilisation.id} className="flex justify-between text-sm">
                    <span>
                      {utilisation.materiel.code} — {utilisation.materiel.designation}
                    </span>
                    <span className="font-medium">
                      {utilisation.heuresUtilisation.toString()}h
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consommations matériaux */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="size-5" aria-hidden="true" />
              Matériaux ({rapport.consommations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rapport.consommations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun matériau consommé
              </p>
            ) : (
              <div className="space-y-2">
                {rapport.consommations.map((conso) => (
                  <div key={conso.id} className="flex justify-between text-sm">
                    <span>{conso.materiau.designation}</span>
                    <span className="font-medium">
                      {conso.quantite.toString()} {conso.unite}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="size-5" aria-hidden="true" />
            Incidents ({rapport.incidents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rapport.incidents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun incident signalé
            </p>
          ) : (
            <div className="space-y-4">
              {rapport.incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{incident.nature}</p>
                    {incident.contientBlessure && (
                      <Badge variant="destructive">Blessure</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {incident.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offline badge if not synced */}
      {rapport.syncEnAttente && (
        <Card className="mt-6 border-warning bg-warning-soft/30">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>En attente de synchronisation :</strong> Ce relevé contient des
              modifications qui n'ont pas encore été envoyées au serveur.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
