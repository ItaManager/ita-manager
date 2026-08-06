import { exigerPermission } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { DerogationsFilters } from "./_components/derogations-filters";
import { DerogationCard } from "./_components/derogation-card";

export const metadata = {
  title: "Dérogations salariales — ITA Manager",
};

interface PageProps {
  searchParams: Promise<{
    statut?: "EN_ATTENTE" | "VALIDEE" | "REFUSEE";
    directionId?: string;
    periode?: "7j" | "30j" | "tout";
  }>;
}

export default async function DerogationsPage({ searchParams }: PageProps) {
  // Vérifier permission
  const session = await exigerPermission("derogation:valider");

  const params = await searchParams;
  const { statut, directionId, periode } = params;

  // Construire les filtres de date
  const maintenant = new Date();
  let dateMin: Date | undefined;

  if (periode === "7j") {
    dateMin = new Date(maintenant);
    dateMin.setDate(dateMin.getDate() - 7);
  } else if (periode === "30j") {
    dateMin = new Date(maintenant);
    dateMin.setDate(dateMin.getDate() - 30);
  }

  // Récupérer les dérogations avec filtres
  const derogations = await prisma.derogationSalariale.findMany({
    where: {
      ...(statut && { statut }),
      ...(dateMin && { demandeLe: { gte: dateMin } }),
      ...(directionId && {
        employe: {
          affectations: {
            some: {
              dateFin: null,
              poste: { directionId },
            },
          },
        },
      }),
    },
    include: {
      employe: {
        select: {
          id: true,
          matricule: true,
          nom: true,
          prenom: true,
          affectations: {
            where: { dateFin: null },
            take: 1,
            include: {
              poste: {
                select: {
                  libelle: true,
                  direction: { select: { libelle: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [
      { statut: "asc" }, // EN_ATTENTE en premier
      { demandeLe: "desc" },
    ],
  });

  // Récupérer les directions pour le filtre
  const directions = await prisma.direction.findMany({
    select: { id: true, libelle: true },
    orderBy: { libelle: "asc" },
  });

  // Statistiques
  const enAttente = derogations.filter((d) => d.statut === "EN_ATTENTE");
  const validees = derogations.filter((d) => d.statut === "VALIDEE");
  const refusees = derogations.filter((d) => d.statut === "REFUSEE");

  // Calcul de l'écart en pourcentage
  const derogationsAvecEcart = derogations.map((d) => {
    const montant = Number(d.montant);
    const max = Number(d.niveauMax);
    const ecartPourcent = Math.round(((montant - max) / max) * 100);

    return {
      ...d,
      ecartPourcent,
    };
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-semibold">Dérogations salariales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Validation des salaires hors grille par la Direction Financière
        </p>
      </div>

      {/* Filtres */}
      <DerogationsFilters directions={directions} />

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-semibold">{enAttente.length}</p>
              </div>
              <Clock className="size-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validées</p>
                <p className="text-2xl font-semibold">{validees.length}</p>
              </div>
              <CheckCircle2 className="size-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Refusées</p>
                <p className="text-2xl font-semibold">{refusees.length}</p>
              </div>
              <XCircle className="size-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dérogations en attente */}
      {enAttente.length > 0 && (
        <Card className="border-warning bg-warning-soft/20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="size-5 text-warning" />
              Demandes en attente de validation ({enAttente.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {derogationsAvecEcart
                .filter((d) => d.statut === "EN_ATTENTE")
                .map((derogation) => (
                  <DerogationCard
                    key={derogation.id}
                    derogation={derogation}
                    sessionUserId={session.userId}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dérogations validées */}
      {validees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="size-5 text-success" />
              Dérogations validées ({validees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {derogationsAvecEcart
                .filter((d) => d.statut === "VALIDEE")
                .map((derogation) => (
                  <DerogationCard
                    key={derogation.id}
                    derogation={derogation}
                    sessionUserId={session.userId}
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dérogations refusées */}
      {refusees.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            <XCircle className="size-4" />
            Dérogations refusées ({refusees.length})
          </summary>

          <div className="mt-4">
            <Card>
              <CardContent className="py-4">
                <div className="space-y-3">
                  {derogationsAvecEcart
                    .filter((d) => d.statut === "REFUSEE")
                    .map((derogation) => (
                      <DerogationCard
                        key={derogation.id}
                        derogation={derogation}
                        sessionUserId={session.userId}
                      />
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </details>
      )}

      {/* État vide */}
      {derogationsAvecEcart.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="size-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Aucune dérogation salariale
            </h3>
            <p className="text-sm text-muted-foreground">
              Les demandes de salaires hors grille apparaîtront ici pour
              validation.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Avertissement */}
      <Card className="border-warning bg-warning-soft/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Règle critique :</strong> Tant qu&apos;une dérogation est en
            attente, l&apos;employé est <strong>exclu des exports de paie</strong>.
            Valider ou refuser rapidement pour ne pas bloquer le cycle de paie.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
