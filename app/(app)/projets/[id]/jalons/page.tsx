import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { obtenirProjet } from "@/lib/actions/projets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Flag, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { StatutJalon } from "@prisma/client";
import { ModalNouveauJalon } from "../../_components/modal-nouveau-jalon";
import { TimelineJalons } from "../../_components/timeline-jalons";
import { BoutonMarquerAtteint } from "../../_components/bouton-marquer-atteint";

interface PageJalonsProps {
  params: Promise<{ id: string }>;
}

const STATUT_LABELS: Record<
  StatutJalon,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  ATTENTE: { label: "En attente", variant: "secondary" },
  VALIDE: { label: "Validé", variant: "default" },
  ABANDONNE: { label: "Abandonné", variant: "destructive" },
};

export default async function PageJalons({ params }: PageJalonsProps) {
  await verifierAccesPage("/projets");
  const { id } = await params;

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      <Suspense fallback={<SqueletteJalons />}>
        <ContenuJalons projetId={id} />
      </Suspense>
    </div>
  );
}

async function ContenuJalons({ projetId }: { projetId: string }) {
  const projet = await obtenirProjet(projetId);

  if (!projet) {
    notFound();
  }

  const jalonsEnAttente = projet.jalons?.filter((j) => j.statut === "ATTENTE") || [];
  const jalonsValides = projet.jalons?.filter((j) => j.statut === "VALIDE") || [];
  const jalonsAbandonnes = projet.jalons?.filter((j) => j.statut === "ABANDONNE") || [];

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
            <Flag className="size-8 text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-bold">Jalons du projet</h1>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {projet.code} — {projet.nom}
              </p>
            </div>
          </div>
        </div>

        <ModalNouveauJalon projetId={projetId} />
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jalonsEnAttente.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Validés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jalonsValides.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projet.jalons && projet.jalons.length > 0
                ? Math.round(
                    (jalonsValides.length / projet.jalons.length) * 100
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline visuelle */}
      {projet.jalons && projet.jalons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <TimelineJalons jalons={projet.jalons} />
          </CardContent>
        </Card>
      )}

      {/* Liste des jalons */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des jalons</CardTitle>
        </CardHeader>
        <CardContent>
          {!projet.jalons || projet.jalons.length === 0 ? (
            <div className="py-12 text-center">
              <Flag className="size-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                Aucun jalon défini pour ce projet
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Les jalons permettent de suivre les événements clés du projet.
                <br />
                Créez votre premier jalon pour commencer.
              </p>
              <ModalNouveauJalon projetId={projetId} />
            </div>
          ) : (
            <div className="space-y-4">
              {projet.jalons.map((jalon) => {
                const statutInfo = STATUT_LABELS[jalon.statut];
                return (
                  <div
                    key={jalon.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <Flag
                          className={`size-5 mt-0.5 ${
                            jalon.statut === "VALIDE"
                              ? "text-green-600"
                              : jalon.statut === "ABANDONNE"
                              ? "text-red-600"
                              : "text-muted-foreground"
                          }`}
                          aria-hidden="true"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{jalon.libelle}</h3>
                          {jalon.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {jalon.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="ml-8 space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium">Date prévisionnelle:</span>
                          {format(
                            new Date(jalon.datePrevisionnelle),
                            "d MMMM yyyy",
                            { locale: fr }
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium">Type de validateur:</span>
                          {jalon.typeValidateur === "INTERNE"
                            ? "Interne (DT/DG)"
                            : jalon.typeValidateur === "MAITRE_OEUVRE"
                            ? "Maître d'œuvre"
                            : "Maître d'ouvrage"}
                        </div>

                        {jalon.validateurExterne && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium">Validateur:</span>
                            {jalon.validateurExterne}
                          </div>
                        )}

                        {jalon.valideLe && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium">Validé le:</span>
                            {format(new Date(jalon.valideLe), "d MMMM yyyy", {
                              locale: fr,
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={statutInfo.variant}>{statutInfo.label}</Badge>
                      {jalon.statut === "ATTENTE" && (
                        <BoutonMarquerAtteint jalonId={jalon.id} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function SqueletteJalons() {
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
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
