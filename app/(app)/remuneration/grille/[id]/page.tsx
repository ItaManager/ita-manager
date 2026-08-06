import { verifierAccesPage } from "@/lib/auth/page-access";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CheckCircle2,
  Archive,
  FileText,
  ArrowLeft,
  Download,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TableauEchelons } from "./_components/tableau-echelons";
import { ModalPublierGrille } from "./_components/modal-publier-grille";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GrilleDetailPage({ params }: PageProps) {
  await verifierAccesPage("/remuneration/grille");

  const { id } = await params;

  // Récupérer la grille avec ses échelons
  const grille = await prisma.grilleSalariale.findUnique({
    where: { id },
    include: {
      echelons: {
        orderBy: { niveau: "asc" },
      },
    },
  });

  if (!grille) {
    notFound();
  }

  // Récupérer le nombre d'employés hors grille (si brouillon)
  let employesHorsGrille: {
    total: number;
    employes: Array<{
      employeId: string;
      matricule: string;
      nom: string;
      prenom: string;
      niveau: string;
      salaireActuel: number;
      min: number;
      max: number;
      ecart: number;
    }>;
  } | null = null;

  if (grille.statut === "BROUILLON") {
    // Calculer employés hors grille
    const employes = await prisma.employe.findMany({
      where: {
        typeMainOeuvre: "PERMANENT",
        archiveLe: null,
      },
      select: {
        id: true,
        matricule: true,
        nom: true,
        prenom: true,
        affectations: {
          where: {
            OR: [{ dateFin: null }, { dateFin: { gte: new Date() } }],
          },
          include: {
            poste: {
              select: { niveau: true },
            },
          },
          orderBy: { dateDebut: "desc" },
          take: 1,
        },
        contrats: {
          where: {
            dateDebut: { lte: new Date() },
            OR: [{ dateFin: null }, { dateFin: { gte: new Date() } }],
          },
          orderBy: { dateDebut: "desc" },
          take: 1,
        },
      },
    });

    const horsGrilleList = [];

    for (const emp of employes) {
      if (emp.affectations.length === 0 || emp.contrats.length === 0) {
        continue;
      }

      const affectation = emp.affectations[0];
      const contrat = emp.contrats[0];
      const niveau = affectation.poste.niveau;

      const echelon = grille.echelons.find((e) => e.niveau === niveau);

      if (!echelon) {
        continue;
      }

      const salaire = Number(contrat.salaire);
      const min = Number(echelon.min);
      const max = Number(echelon.max);

      if (salaire < min || salaire > max) {
        horsGrilleList.push({
          employeId: emp.id,
          matricule: emp.matricule,
          nom: emp.nom,
          prenom: emp.prenom,
          niveau,
          salaireActuel: salaire,
          min,
          max,
          ecart: salaire < min ? salaire - min : salaire - max,
        });
      }
    }

    employesHorsGrille = {
      total: horsGrilleList.length,
      employes: horsGrilleList,
    };
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Link href="/remuneration/grille">
          <Button variant="ghost" size="sm" className="rounded-full">
            <ArrowLeft className="size-4" />
            Retour à la liste
          </Button>
        </Link>
      </div>

      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              Grille salariale — Version {grille.version}
            </h1>
            {grille.statut === "PUBLIEE" && (
              <Badge variant="outline" className="border-success text-success">
                Publiée
              </Badge>
            )}
            {grille.statut === "BROUILLON" && (
              <Badge variant="secondary">Brouillon</Badge>
            )}
            {grille.statut === "ARCHIVEE" && (
              <Badge variant="outline">Archivée</Badge>
            )}
          </div>

          {grille.dateEffet && (
            <p className="mt-2 text-sm text-muted-foreground">
              {grille.statut === "PUBLIEE" ? "En application depuis" : "Date d'effet"} le{" "}
              {format(new Date(grille.dateEffet), "d MMMM yyyy", {
                locale: fr,
              })}
            </p>
          )}

          {grille.valideLe && grille.statut === "PUBLIEE" && (
            <p className="text-sm text-muted-foreground">
              Validée le{" "}
              {format(new Date(grille.valideLe), "d MMMM yyyy à HH:mm", {
                locale: fr,
              })}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {grille.statut === "BROUILLON" && (
            <>
              <ModalPublierGrille
                grilleId={grille.id}
                version={grille.version}
                employesHorsGrille={employesHorsGrille}
              />
            </>
          )}

          {grille.statut === "PUBLIEE" && (
            <>
              <Button variant="outline" size="sm" className="rounded-full">
                <Download className="size-4" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-muted-foreground"
              >
                <Archive className="size-4" />
                Archiver
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Alerte employés hors grille (brouillon) */}
      {grille.statut === "BROUILLON" && employesHorsGrille && employesHorsGrille.total > 0 && (
        <Card className="border-warning bg-warning-soft/30">
          <CardContent className="py-4">
            <p className="text-sm font-medium mb-2">
              <strong>{employesHorsGrille.total}</strong> employé
              {employesHorsGrille.total > 1 ? "s" : ""} seront hors grille à la publication :
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {employesHorsGrille.employes.slice(0, 5).map((emp) => (
                <li key={emp.employeId}>
                  {emp.prenom} {emp.nom} ({emp.matricule}) — {emp.salaireActuel.toLocaleString("fr-FR")} FCFA
                  (fourchette : {emp.min.toLocaleString("fr-FR")} - {emp.max.toLocaleString("fr-FR")})
                </li>
              ))}
              {employesHorsGrille.total > 5 && (
                <li className="text-xs">
                  ... et {employesHorsGrille.total - 5} autre
                  {employesHorsGrille.total - 5 > 1 ? "s" : ""}
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tableau des échelons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="size-5" />
            Fourchettes par niveau hiérarchique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TableauEchelons echelons={grille.echelons} />
        </CardContent>
      </Card>

      {/* Informations système */}
      <Card className="border-info bg-info-soft/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Créée le</strong>{" "}
            {format(new Date(grille.creeLe), "d MMMM yyyy à HH:mm", {
              locale: fr,
            })}
          </p>
          {grille.statut === "BROUILLON" && (
            <p className="text-xs text-muted-foreground mt-1">
              Les brouillons peuvent être modifiés ou supprimés. Une fois publiée, la grille devient immuable.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Règles de gestion */}
      <Card className="border-border">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground mb-2">
            <strong>Règles de gestion :</strong>
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>La publication archive automatiquement la version précédente</li>
            <li>
              Les employés dont le salaire sort de la nouvelle fourchette passent en dérogation automatique
            </li>
            <li>Fourchette requise : min &lt; médiane &lt; max</li>
            <li>Une grille publiée ne peut plus être modifiée (immuable)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
