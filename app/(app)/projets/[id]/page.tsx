import { Suspense } from "react";
import { notFound } from "next/navigation";
import { obtenirProjet } from "@/lib/actions/projets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderKanban,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  ListTodo,
  Flag,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { StatutProjet } from "@prisma/client";

interface PageDetailProjetProps {
  params: Promise<{ id: string }>;
}

const STATUT_LABELS: Record<
  StatutProjet,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  BROUILLON: { label: "Brouillon", variant: "secondary" },
  OUVERT: { label: "Ouvert", variant: "default" },
  EN_COURS: { label: "En cours", variant: "outline" },
  SUSPENDU: { label: "Suspendu", variant: "destructive" },
  CLOTURE: { label: "Clôturé", variant: "secondary" },
};

export default async function PageDetailProjet({ params }: PageDetailProjetProps) {
  await verifierAccesPage("/projets");
  const { id } = await params;

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      <Suspense fallback={<SqueletteDetailProjet />}>
        <DetailProjet projetId={id} />
      </Suspense>
    </div>
  );
}

async function DetailProjet({ projetId }: { projetId: string }) {
  const projet = await obtenirProjet(projetId);

  if (!projet) {
    notFound();
  }

  const statutInfo = STATUT_LABELS[projet.statut];

  return (
    <>
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <FolderKanban className="size-8 text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-bold">{projet.nom}</h1>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {projet.code}
              </p>
            </div>
            <Badge variant={statutInfo.variant}>{statutInfo.label}</Badge>
          </div>
        </div>

        {/* Actions - TODO: ajouter boutons selon statut */}
        <div className="flex items-center gap-3">
          {/* Boutons d'actions à implémenter */}
        </div>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="informations" className="w-full">
        <TabsList>
          <TabsTrigger value="informations">
            <FolderKanban className="size-4 mr-2" aria-hidden="true" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="equipe">
            <Users className="size-4 mr-2" aria-hidden="true" />
            Équipe ({projet.affectations?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="jalons">
            <Flag className="size-4 mr-2" aria-hidden="true" />
            Jalons ({projet.jalons?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="taches">
            <ListTodo className="size-4 mr-2" aria-hidden="true" />
            Tâches
          </TabsTrigger>
        </TabsList>

        {/* Onglet Informations */}
        <TabsContent value="informations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {projet.description && (
                  <div>
                    <span className="text-sm text-muted-foreground">Description</span>
                    <p className="mt-1">{projet.description}</p>
                  </div>
                )}

                {projet.maitreOuvrage && (
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="size-4" aria-hidden="true" />
                      Maître d'ouvrage
                    </span>
                    <p className="mt-1 font-medium">{projet.maitreOuvrage}</p>
                  </div>
                )}

                {projet.montantMarche && (
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="size-4" aria-hidden="true" />
                      Montant du marché
                    </span>
                    <p className="mt-1 text-lg font-bold">
                      {new Intl.NumberFormat("fr-FR", {
                        style: "decimal",
                        minimumFractionDigits: 0,
                      }).format(projet.montantMarche)}{" "}
                      FCFA
                    </p>
                  </div>
                )}

                {projet.cyclePaie && (
                  <div>
                    <span className="text-sm text-muted-foreground">Cycle de paie</span>
                    <p className="mt-1 font-medium">
                      {projet.cyclePaie === "HEBDOMADAIRE"
                        ? "Hebdomadaire"
                        : projet.cyclePaie === "QUINZAINE"
                        ? "Quinzaine"
                        : "Mensuel"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Planning */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="size-5" aria-hidden="true" />
                  Planning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {projet.dateDebut && (
                  <div>
                    <span className="text-sm text-muted-foreground">Date de début</span>
                    <p className="mt-1 font-medium">
                      {format(new Date(projet.dateDebut), "d MMMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                )}

                {projet.dateFin && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Date de fin prévisionnelle
                    </span>
                    <p className="mt-1 font-medium">
                      {format(new Date(projet.dateFin), "d MMMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                )}

                {projet.dateDebut && projet.dateFin && (
                  <div>
                    <span className="text-sm text-muted-foreground">Durée</span>
                    <p className="mt-1 font-medium">
                      {Math.ceil(
                        (new Date(projet.dateFin).getTime() -
                          new Date(projet.dateDebut).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      jours
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-sm text-muted-foreground">Créé le</span>
                  <p className="mt-1 text-sm">
                    {format(new Date(projet.creeLe), "d MMMM yyyy 'à' HH:mm", {
                      locale: fr,
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TODO M5: Lieu de livraison désactivé — lieuLivraison non inclus dans obtenirProjet() */}
          {/*
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-5" aria-hidden="true" />
                Lieu de livraison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{projet.lieuLivraison.libelle}</p>
                {projet.lieuLivraison.adresse && (
                  <p className="text-sm text-muted-foreground">
                    {projet.lieuLivraison.adresse}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          */}
        </TabsContent>

        {/* Onglet Équipe */}
        <TabsContent value="equipe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Équipe affectée</CardTitle>
            </CardHeader>
            <CardContent>
              {projet.affectations && projet.affectations.length > 0 ? (
                <div className="space-y-3">
                  {projet.affectations.map((affectation) => (
                    <div
                      key={affectation.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {affectation.employe.prenom} {affectation.employe.nom}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {affectation.employe.matricule} • {affectation.roleFonctionnel}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Depuis le{" "}
                          {format(new Date(affectation.dateDebut), "d MMMM yyyy", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Aucune affectation active sur ce projet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Jalons */}
        <TabsContent value="jalons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jalons du projet</CardTitle>
            </CardHeader>
            <CardContent>
              {projet.jalons && projet.jalons.length > 0 ? (
                <div className="space-y-3">
                  {projet.jalons.map((jalon) => (
                    <div
                      key={jalon.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{jalon.libelle}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(jalon.datePrevisionnelle), "d MMMM yyyy", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          jalon.statut === "VALIDE"
                            ? "default"
                            : jalon.statut === "ABANDONNE"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {jalon.statut === "VALIDE"
                          ? "Validé"
                          : jalon.statut === "ABANDONNE"
                          ? "Abandonné"
                          : "En attente"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Aucun jalon défini pour ce projet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Tâches */}
        <TabsContent value="taches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tâches récentes</CardTitle>
            </CardHeader>
            <CardContent>
              {/* TODO M5: taches non incluses dans obtenirProjet() */}
              <p className="text-sm text-muted-foreground py-8 text-center">
                Aucune tâche définie pour ce projet
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function SqueletteDetailProjet() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8" />
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
