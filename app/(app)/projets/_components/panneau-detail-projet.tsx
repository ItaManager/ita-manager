"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { obtenirProjet } from "@/lib/actions/projets";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Milestone,
  RefreshCw,
  BarChart3,
  ListTodo,
  Plus,
} from "lucide-react";
import { GanttChart } from "./gantt-chart";
import { ModalTache } from "./modal-tache";
import { ModalJalon } from "./modal-jalon";
import { StatutProjet } from "@prisma/client";

const STATUT_LABELS: Record<StatutProjet, { label: string; color: string }> = {
  BROUILLON: { label: "Brouillon", color: "#6B7280" },
  OUVERT: { label: "Ouvert", color: "#3B82F6" },
  EN_COURS: { label: "En cours", color: "#13850b" },
  SUSPENDU: { label: "Suspendu", color: "#EF4444" },
  CLOTURE: { label: "Clôturé", color: "#9CA3AF" },
};

interface PanneauDetailProjetProps {
  projetId: string;
  ouvert: boolean;
  onFermer: () => void;
}

export function PanneauDetailProjet({
  projetId,
  ouvert,
  onFermer,
}: PanneauDetailProjetProps) {
  const [projet, setProjet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalTacheOuverte, setModalTacheOuverte] = useState(false);
  const [tacheSelectionnee, setTacheSelectionnee] = useState<any>(null);
  const [modalJalonOuverte, setModalJalonOuverte] = useState(false);
  const [jalonSelectionne, setJalonSelectionne] = useState<any>(null);

  useEffect(() => {
    if (ouvert && projetId) {
      chargerProjet();
    }
  }, [projetId, ouvert]);

  async function chargerProjet() {
    setLoading(true);
    try {
      const data = await obtenirProjet(projetId);
      setProjet(data);
    } catch (error) {
      console.error("Erreur chargement projet:", error);
    } finally {
      setLoading(false);
    }
  }

  function ouvrirModalTache(tache?: any) {
    setTacheSelectionnee(tache || null);
    setModalTacheOuverte(true);
  }

  function fermerModalTache() {
    setModalTacheOuverte(false);
    setTacheSelectionnee(null);
  }

  function handleClickTache(tacheGantt: any) {
    // Retrouver la tâche complète depuis le projet
    if (tacheGantt.type === "tache") {
      const tacheComplete = projet.taches.find((t: any) => t.id === tacheGantt.id);
      if (tacheComplete) {
        ouvrirModalTache(tacheComplete);
      }
    }
  }

  function ouvrirModalJalon(jalon?: any) {
    setJalonSelectionne(jalon || null);
    setModalJalonOuverte(true);
  }

  function fermerModalJalon() {
    setModalJalonOuverte(false);
    setJalonSelectionne(null);
  }

  // Combiner tâches et jalons pour le Gantt
  const tachesGantt = projet
    ? [
        ...(projet.taches?.map((t: any) => ({
          id: t.id,
          libelle: t.libelle,
          dateDebut: t.dateDebut,
          dateFin: t.dateFin,
          avancementPlanifie: t.avancementPlanifie || 0,
          type: "tache" as const,
        })) || []),
        ...(projet.jalons?.map((j: any) => ({
          id: j.id,
          libelle: j.libelle,
          dateDebut: j.datePrevisionnelle,
          dateFin: j.datePrevisionnelle,
          avancementPlanifie: 0,
          type: "jalon" as const,
          statut: j.statut,
        })) || []),
      ]
    : [];

  // Calcul des indicateurs
  const nbTaches = projet?.taches?.length || 0;
  const nbJalons = projet?.jalons?.length || 0;
  const nbMembresEquipe = projet?.affectations?.length || 0;

  // Calcul avancement moyen
  const avancementMoyen = nbTaches > 0
    ? Math.round(
        projet.taches.reduce((sum: number, t: any) => sum + (t.avancementPlanifie || 0), 0) / nbTaches
      )
    : 0;

  return (
    <Sheet open={ouvert} onOpenChange={onFermer}>
      <SheetContent className="w-full sm:max-w-5xl overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : projet ? (
          <>
            {/* En-tête avec code, nom et statut */}
            <SheetHeader className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-mono text-muted-foreground">
                    {projet.code}
                  </p>
                  <SheetTitle className="mt-1 text-2xl">
                    {projet.nom}
                  </SheetTitle>
                  {projet.maitreOuvrage && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {projet.maitreOuvrage}
                    </p>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${STATUT_LABELS[projet.statut as StatutProjet].color}20`,
                    color: STATUT_LABELS[projet.statut as StatutProjet].color,
                  }}
                  className="shrink-0"
                >
                  {STATUT_LABELS[projet.statut as StatutProjet].label}
                </Badge>
              </div>
            </SheetHeader>

            {/* Indicateurs clés */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{avancementMoyen}%</p>
                      <p className="text-xs text-muted-foreground">Avancement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <ListTodo className="size-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{nbTaches}</p>
                      <p className="text-xs text-muted-foreground">Tâches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Milestone className="size-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{nbJalons}</p>
                      <p className="text-xs text-muted-foreground">Jalons</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Users className="size-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{nbMembresEquipe}</p>
                      <p className="text-xs text-muted-foreground">Équipe</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Onglets */}
            <Tabs defaultValue="planning" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="planning">Planning</TabsTrigger>
                <TabsTrigger value="equipe">Équipe</TabsTrigger>
                <TabsTrigger value="jalons">Jalons</TabsTrigger>
              </TabsList>

              {/* Onglet Planning */}
              <TabsContent value="planning" className="space-y-4">
                {/* Informations générales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {projet.dateDebut && projet.dateFin && (
                      <div className="flex items-start gap-3">
                        <Calendar className="size-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Période</p>
                          <p className="text-sm font-medium">
                            {format(new Date(projet.dateDebut), "dd MMM yyyy", {
                              locale: fr,
                            })}{" "}
                            au{" "}
                            {format(new Date(projet.dateFin), "dd MMM yyyy", {
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {projet.montantMarche && (
                      <div className="flex items-start gap-3">
                        <DollarSign className="size-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Montant du marché
                          </p>
                          <p className="text-sm font-medium">
                            {projet.montantMarche.toLocaleString("fr-FR")} FCFA
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Diagramme de Gantt */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Milestone className="size-4" />
                        Diagramme de Gantt
                      </CardTitle>
                      <Button
                        size="sm"
                        onClick={() => ouvrirModalTache()}
                      >
                        <Plus className="size-4 mr-1" />
                        Nouvelle tâche
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <GanttChart
                      taches={tachesGantt}
                      onClickTache={handleClickTache}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Équipe */}
              <TabsContent value="equipe" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Membres de l'équipe ({nbMembresEquipe})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {projet.affectations && projet.affectations.length > 0 ? (
                      <div className="space-y-3">
                        {projet.affectations.map((aff: any) => (
                          <div
                            key={aff.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="size-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {aff.employe.prenom} {aff.employe.nom}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {aff.roleFonctionnel}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                Depuis le{" "}
                                {format(new Date(aff.dateDebut), "dd MMM yyyy", {
                                  locale: fr,
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <Users className="size-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Aucun membre affecté à ce projet
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Jalons */}
              <TabsContent value="jalons" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        Jalons du projet ({nbJalons})
                      </CardTitle>
                      <Button
                        size="sm"
                        onClick={() => ouvrirModalJalon()}
                      >
                        <Plus className="size-4 mr-1" />
                        Nouveau jalon
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {projet.jalons && projet.jalons.length > 0 ? (
                      <div className="space-y-3">
                        {projet.jalons.map((jalon: any) => (
                          <div
                            key={jalon.id}
                            className="flex items-start justify-between gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => ouvrirModalJalon(jalon)}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{jalon.libelle}</p>
                              {jalon.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {jalon.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                📅 Prévu le{" "}
                                {format(
                                  new Date(jalon.datePrevisionnelle),
                                  "dd MMMM yyyy",
                                  { locale: fr }
                                )}
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
                              style={{
                                backgroundColor:
                                  jalon.statut === "VALIDE"
                                    ? "#13850b"
                                    : undefined,
                              }}
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
                      <div className="py-12 text-center">
                        <Milestone className="size-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Aucun jalon défini pour ce projet
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Projet introuvable</p>
          </div>
        )}
      </SheetContent>

      {/* Modal de gestion des tâches */}
      {projet && (
        <ModalTache
          projetId={projet.id}
          tache={tacheSelectionnee}
          ouvert={modalTacheOuverte}
          onFermer={fermerModalTache}
          onSuccess={chargerProjet}
        />
      )}

      {/* Modal de gestion des jalons */}
      {projet && (
        <ModalJalon
          projetId={projet.id}
          jalon={jalonSelectionne}
          ouvert={modalJalonOuverte}
          onFermer={fermerModalJalon}
          onSuccess={chargerProjet}
        />
      )}
    </Sheet>
  );
}
