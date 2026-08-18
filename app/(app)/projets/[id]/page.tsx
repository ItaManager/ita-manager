"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenirProjet } from "@/lib/actions/projets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  Building2,
  MapPin,
  User,
  TrendingUp,
  Calendar as CalendarIcon,
  Plus,
  Pencil,
  Search,
  ChevronRight,
  Users,
} from "lucide-react";
import { StatutProjet } from "@prisma/client";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { ModalAffecterEmploye } from "../_components/modal-affecter-employe";
import { ModaleEditionChamp } from "../_components/modale-edition-champ";
import { ModaleAssignerConducteur } from "../_components/modale-assigner-conducteur";
import { ModalTache } from "../_components/modal-tache";
import { ModalAffecterEquipeRapide } from "../_components/modal-affecter-equipe-rapide";

interface PageDetailProjetProps {
  params: Promise<{ id: string }>;
}

const STATUT_CONFIG: Record<
  StatutProjet,
  { label: string; color: string; bg: string }
> = {
  BROUILLON: { label: "Brouillon", color: "#6B7280", bg: "#6B728020" },
  OUVERT: { label: "Ouvert", color: "#3B82F6", bg: "#3B82F620" },
  EN_COURS: { label: "En cours", color: "#13850b", bg: "#13850b20" },
  SUSPENDU: { label: "Suspendu", color: "#EF4444", bg: "#EF444420" },
  CLOTURE: { label: "Clôturé", color: "#9CA3AF", bg: "#9CA3AF20" },
};

export default function PageDetailProjet({ params }: PageDetailProjetProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [projet, setProjet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ongletActif, setOngletActif] = useState<
    "avancement" | "equipes" | "budget" | "jalons"
  >("avancement");
  const [rechercheAffectation, setRechercheAffectation] = useState("");
  const [pageAffectation, setPageAffectation] = useState(1);
  const ITEMS_PAR_PAGE = 10;
  const [modalTacheOuverte, setModalTacheOuverte] = useState(false);
  const [tacheSelectionnee, setTacheSelectionnee] = useState<any>(null);
  const [modalEquipeRapideOuverte, setModalEquipeRapideOuverte] = useState(false);
  const [tachePourEquipe, setTachePourEquipe] = useState<any>(null);

  useEffect(() => {
    chargerProjet();
  }, [resolvedParams.id]);

  // Réinitialiser la page lors du changement de recherche
  useEffect(() => {
    setPageAffectation(1);
  }, [rechercheAffectation]);

  async function chargerProjet() {
    setLoading(true);
    try {
      const data = await obtenirProjet(resolvedParams.id);
      setProjet(data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }

  function ouvrirModalCreationTache() {
    setTacheSelectionnee(null);
    setModalTacheOuverte(true);
  }

  function ouvrirModalEditionTache(tache: any) {
    setTacheSelectionnee(tache);
    setModalTacheOuverte(true);
  }

  function fermerModalTache() {
    setModalTacheOuverte(false);
    setTacheSelectionnee(null);
  }

  function handleSuccesTache() {
    chargerProjet();
    fermerModalTache();
  }

  function ouvrirModalEquipeRapide(tache: any) {
    setTachePourEquipe(tache);
    setModalEquipeRapideOuverte(true);
  }

  function fermerModalEquipeRapide() {
    setModalEquipeRapideOuverte(false);
    setTachePourEquipe(null);
  }

  function handleSuccesEquipe() {
    chargerProjet();
    fermerModalEquipeRapide();
  }

  if (loading) {
    return (
      <div className="space-y-6 px-[60px] max-w-[1200px] mx-auto py-8">
        <p className="text-center text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!projet) {
    return (
      <div className="space-y-6 px-[60px] max-w-[1200px] mx-auto py-8">
        <p className="text-center text-muted-foreground">Projet introuvable</p>
      </div>
    );
  }

  const statutConfig = STATUT_CONFIG[projet.statut as StatutProjet];

  // Calculs
  const avancementAffiche =
    projet.avancementConstate ?? projet.avancementPlanifie ?? 0;
  const ecartAvancement =
    projet.avancementConstate !== null && projet.avancementPlanifie !== null
      ? projet.avancementConstate - projet.avancementPlanifie
      : null;

  const joursRestants = projet.dateFin
    ? differenceInDays(new Date(projet.dateFin), new Date())
    : null;

  return (
    <div className="space-y-6 px-[60px] max-w-[1200px] mx-auto py-6">
      {/* Bouton retour */}
      <Button
        variant="ghost"
        onClick={() => router.push("/projets")}
        className="gap-2 rounded-full"
      >
        <ChevronLeft className="size-4" />
        Retour aux chantiers
      </Button>

      {/* En-tête projet */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              {/* Code + Statut */}
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 text-xs font-semibold bg-muted rounded-full">
                  {projet.code}
                </span>
                <Badge
                  style={{
                    backgroundColor: statutConfig.bg,
                    color: statutConfig.color,
                    border: `1px solid ${statutConfig.color}30`,
                  }}
                >
                  {statutConfig.label}
                </Badge>
                <ModaleEditionChamp
                  projetId={projet.id}
                  champ="statut"
                  label="Statut du projet"
                  valeurActuelle={projet.statut}
                  type="statutProjet"
                  onSuccess={chargerProjet}
                />
              </div>

              {/* Titre */}
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{projet.nom}</h1>
                <ModaleEditionChamp
                  projetId={projet.id}
                  champ="nom"
                  label="Nom du projet"
                  valeurActuelle={projet.nom}
                  type="text"
                  onSuccess={chargerProjet}
                />
              </div>

              {/* Informations */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="size-4" />
                  <span>{projet.maitreOuvrage || "Non défini"}</span>
                  <ModaleEditionChamp
                    projetId={projet.id}
                    champ="maitreOuvrage"
                    label="Maître d'ouvrage"
                    valeurActuelle={projet.maitreOuvrage}
                    type="text"
                    onSuccess={chargerProjet}
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>{projet.localisation || "Non défini"}</span>
                  <ModaleEditionChamp
                    projetId={projet.id}
                    champ="localisation"
                    label="Localisation"
                    valeurActuelle={projet.localisation}
                    type="text"
                    onSuccess={chargerProjet}
                  />
                </div>
              </div>
            </div>

            {/* Montant du marché */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-1">
                <p className="text-xs text-muted-foreground uppercase">
                  Montant du marché
                </p>
                <ModaleEditionChamp
                  projetId={projet.id}
                  champ="montantMarche"
                  label="Montant du marché (FCFA)"
                  valeurActuelle={projet.montantMarche}
                  type="number"
                  onSuccess={chargerProjet}
                  requireConfirmation
                  confirmationMessage="Modifier le montant du marché peut impacter les budgets et états financiers. Confirmer ?"
                />
              </div>
              <p className="text-3xl font-bold text-green-600">
                {projet.montantMarche
                  ? projet.montantMarche.toLocaleString("fr-FR").replace(/,/g, " ")
                  : "Non défini"}
              </p>
              <p className="text-sm text-muted-foreground">FCFA</p>
              {projet.montantAvenant && (
                <p className="text-sm text-primary mt-2">
                  dont {projet.montantAvenant.toLocaleString("fr-FR").replace(/,/g, " ")} F d'avenant
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barre d'avancement */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Avancement</span>
            <span className="text-2xl font-bold">{avancementAffiche} % constaté</span>
          </div>

          {/* Barre de progression */}
          <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-green-600 rounded-full transition-all"
              style={{ width: `${avancementAffiche}%` }}
            />
          </div>

          {/* Planifié et écart */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              planifié {projet.avancementPlanifie ?? 0} %
            </span>
            {ecartAvancement !== null && ecartAvancement !== 0 && (
              <span
                className={`text-sm font-medium ${
                  ecartAvancement > 0 ? "text-green-600" : "text-orange-500"
                }`}
              >
                {ecartAvancement > 0 ? "+" : ""}
                {ecartAvancement} pts{" "}
                {ecartAvancement > 0 ? "d'avance" : "de retard"}
              </span>
            )}
            {ecartAvancement === 0 && (
              <span className="text-sm text-green-600 font-medium">
                conforme
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations complémentaires */}
      <div className="grid grid-cols-2 gap-6">
        {/* Période */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Période
            </p>
            <ModaleEditionChamp
              projetId={projet.id}
              champ="periode"
              label="Période"
              valeurActuelle={{
                debut: projet.dateDebut,
                fin: projet.dateFin,
              }}
              type="periode"
              onSuccess={chargerProjet}
              requireConfirmation
              confirmationMessage="Modifier la période du projet peut impacter le planning et les échéances. Confirmer ?"
            />
          </div>
          {projet.dateDebut || projet.dateFin ? (
            <>
              <p className="text-base font-semibold">
                {projet.dateDebut
                  ? format(new Date(projet.dateDebut), "dd/MM/yyyy", {
                      locale: fr,
                    })
                  : "—"}{" "}
                →{" "}
                {projet.dateFin
                  ? format(new Date(projet.dateFin), "dd/MM/yyyy", {
                      locale: fr,
                    })
                  : "—"}
              </p>
              {joursRestants !== null && (
                <p
                  className={`text-sm mt-1 ${
                    joursRestants < 0
                      ? "text-destructive"
                      : joursRestants <= 30
                      ? "text-orange-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {joursRestants < 0
                    ? `${Math.abs(joursRestants)} jours dépassés`
                    : `${joursRestants} jours restants`}
                </p>
              )}
            </>
          ) : (
            <p className="text-base text-muted-foreground">Non définie</p>
          )}
        </div>

        {/* Conducteur de travaux */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Conducteur de travaux
            </p>
            <ModaleAssignerConducteur
              projetId={projet.id}
              conducteurActuelId={projet.conducteur?.id}
              conducteurActuelNom={
                projet.conducteur
                  ? `${projet.conducteur.prenom} ${projet.conducteur.nom}`
                  : undefined
              }
              onSuccess={chargerProjet}
            />
          </div>
          {projet.conducteur ? (
            <>
              <p className="text-base font-semibold">
                {projet.conducteur.prenom} {projet.conducteur.nom}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                référent fonctionnel — vise les relevés
              </p>
            </>
          ) : (
            <p className="text-base text-muted-foreground">Non assigné</p>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="border-b">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setOngletActif("avancement")}
            className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
              ongletActif === "avancement"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="size-4 inline mr-2" />
            Avancement
            {ongletActif === "avancement" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>

          <button
            onClick={() => setOngletActif("equipes")}
            className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
              ongletActif === "equipes"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="size-4 inline mr-2" />
            Équipes (0)
            {ongletActif === "equipes" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>

          <button
            onClick={() => setOngletActif("budget")}
            className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
              ongletActif === "budget"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Budget
            {ongletActif === "budget" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>

          <button
            onClick={() => setOngletActif("jalons")}
            className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
              ongletActif === "jalons"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarIcon className="size-4 inline mr-2" />
            Jalons (0)
            {ongletActif === "jalons" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Contenu de l'onglet Avancement */}
      {ongletActif === "avancement" && (
        <div className="space-y-6">
          {/* En-tête Tâches */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tâches</h2>
            <Button
              onClick={ouvrirModalCreationTache}
              className="gap-2 h-10 px-4 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground transition-all"
            >
              <Plus className="size-4" />
              Ajouter
            </Button>
          </div>

          {/* Tableau des tâches */}
          <div className="border rounded-lg overflow-hidden shadow-none bg-white">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground uppercase">
                    Tâche
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground uppercase">
                    Début
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground uppercase">
                    Fin
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground uppercase">
                    Planifié
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground uppercase">
                    Constaté
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground uppercase">
                    Écart
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground uppercase w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {projet.taches && projet.taches.length > 0 ? (
                  projet.taches.map((tache: any) => {
                    const ecart =
                      tache.avancementConstate !== null &&
                      tache.avancementPlanifie !== null
                        ? tache.avancementConstate - tache.avancementPlanifie
                        : null;

                    return (
                      <tr
                        key={tache.id}
                        onClick={() => ouvrirModalEditionTache(tache)}
                        className="border-b hover:bg-muted/30 cursor-pointer"
                      >
                        <td className="py-3 px-4 text-sm">{tache.libelle}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {tache.dateDebut
                            ? format(new Date(tache.dateDebut), "dd/MM/yyyy")
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {tache.dateFin
                            ? format(new Date(tache.dateFin), "dd/MM/yyyy")
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {tache.avancementPlanifie ?? 0} %
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">
                          {tache.avancementConstate !== null
                            ? `${tache.avancementConstate} %`
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {ecart !== null ? (
                            <span
                              className={
                                ecart > 0
                                  ? "text-green-600 font-medium"
                                  : ecart < 0
                                  ? "text-orange-500 font-medium"
                                  : "text-muted-foreground"
                              }
                            >
                              {ecart > 0 ? "+" : ""}
                              {ecart} pts
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td
                          className="py-3 px-4 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => ouvrirModalEquipeRapide(tache)}
                            className="h-8 w-8 p-0"
                            title="Composer l'équipe rapidement"
                          >
                            <Users className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      Aucune tâche créée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Explications pédagogiques */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold mb-3">
              Deux avancements, jamais confondus
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-background">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Planifié</h4>
                  <p className="text-sm text-muted-foreground">
                    Ce que le planning prévoit à cette date. Saisi par le
                    Conducteur de Travaux ou le Chargé d'études.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Constaté</h4>
                  <p className="text-sm text-muted-foreground">
                    Déclaré au relevé d'activité par le chef de chantier, puis
                    visé. Il ne remplace pas le planifié.
                  </p>
                </CardContent>
              </Card>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              <span className="font-semibold">L'écart est calculé, jamais stocké.</span>{" "}
              C'est lui qui appelle une décision : accélérer, replanifier, ou
              constater un retard.
            </p>
          </div>
        </div>
      )}

      {/* Onglet Équipes */}
      {ongletActif === "equipes" && (
        <div className="space-y-6">
          {/* Encadré Chaîne fonctionnelle */}
          <div className="rounded-lg bg-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-lg font-bold text-foreground">
                  Chaîne fonctionnelle
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Les affectations de chantier portent la chaîne{" "}
                    <span className="font-semibold text-foreground">fonctionnelle</span>{" "}
                    : qui vise les relevés d'activité, qui organise le planning.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Elles ne portent{" "}
                    <span className="font-semibold text-foreground">pas</span>{" "}
                    la chaîne hiérarchique. Un chef de chantier relève du
                    Directeur Technique pour ses congés, et du Conducteur de
                    Travaux pour ses relevés.
                  </p>
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Le code ne doit jamais confondre les deux
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Affectations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Affectations</h2>
              <ModalAffecterEmploye
                projetId={projet.id}
                projetCode={projet.code}
                projetNom={projet.nom}
              >
                <Button className="gap-2 h-10 px-4 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground transition-all">
                  <Plus className="size-4" />
                  Affecter
                </Button>
              </ModalAffecterEmploye>
            </div>

            {/* Barre de recherche */}
            <div className="mb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un employé..."
                  value={rechercheAffectation}
                  onChange={(e) => setRechercheAffectation(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden bg-white shadow-none">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Employé
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Poste
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Rôle sur le chantier
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Depuis
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Jusqu'au
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const affectationsFiltrees = projet.affectations?.filter((affectation: any) => {
                      const nomComplet = `${affectation.employe.prenom} ${affectation.employe.nom}`.toLowerCase();
                      return nomComplet.includes(rechercheAffectation.toLowerCase());
                    }) || [];

                    // Pagination
                    const totalPages = Math.ceil(affectationsFiltrees.length / ITEMS_PAR_PAGE);
                    const indexDebut = (pageAffectation - 1) * ITEMS_PAR_PAGE;
                    const indexFin = indexDebut + ITEMS_PAR_PAGE;
                    const affectationsPaginees = affectationsFiltrees.slice(indexDebut, indexFin);

                    return affectationsPaginees.length > 0 ? (
                      affectationsPaginees.map((affectation: any) => (
                      <tr
                        key={affectation.id}
                        className="border-b hover:bg-muted/30"
                      >
                        <td className="py-3 px-4 text-sm">
                          {affectation.employe.prenom} {affectation.employe.nom}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          —
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {affectation.roleFonctionnel}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {affectation.dateDebut
                            ? format(
                                new Date(affectation.dateDebut),
                                "dd/MM/yyyy"
                              )
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {affectation.dateFin
                            ? format(new Date(affectation.dateFin), "dd/MM/yyyy")
                            : "En cours"}
                        </td>
                        <td className="py-3 px-4">
                          <ModalAffecterEmploye
                            projetId={projet.id}
                            projetCode={projet.code}
                            projetNom={projet.nom}
                            affectation={{
                              id: affectation.id,
                              employeId: affectation.employe.id,
                              employeNom: affectation.employe.nom,
                              employePrenom: affectation.employe.prenom,
                              roleFonctionnel: affectation.roleFonctionnel,
                              dateDebut: affectation.dateDebut,
                              dateFin: affectation.dateFin,
                            }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-8 px-3 rounded-full hover:bg-muted transition-colors"
                            >
                              <Pencil className="size-3.5" />
                              Modifier
                            </Button>
                          </ModalAffecterEmploye>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        {rechercheAffectation
                          ? "Aucun employé trouvé"
                          : "Aucune affectation"}
                      </td>
                    </tr>
                  );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {(() => {
              const affectationsFiltrees = projet.affectations?.filter((affectation: any) => {
                const nomComplet = `${affectation.employe.prenom} ${affectation.employe.nom}`.toLowerCase();
                return nomComplet.includes(rechercheAffectation.toLowerCase());
              }) || [];

              const totalPages = Math.ceil(affectationsFiltrees.length / ITEMS_PAR_PAGE);

              if (totalPages <= 1) return null;

              return (
                <div className="flex items-center justify-between mt-4 px-2">
                  <p className="text-sm text-muted-foreground">
                    Page {pageAffectation} sur {totalPages} · {affectationsFiltrees.length} résultat{affectationsFiltrees.length > 1 ? 's' : ''}
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageAffectation(Math.max(1, pageAffectation - 1))}
                      disabled={pageAffectation === 1}
                      className="h-8 px-3 rounded-full"
                    >
                      <ChevronLeft className="size-4" />
                      Précédent
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Afficher max 5 pages : première, dernière, actuelle et ±1
                        const shouldShow =
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - pageAffectation) <= 1;

                        if (!shouldShow) {
                          // Afficher "..." une seule fois
                          if (page === pageAffectation - 2 || page === pageAffectation + 2) {
                            return (
                              <span key={page} className="px-2 text-muted-foreground">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }

                        return (
                          <Button
                            key={page}
                            variant={page === pageAffectation ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPageAffectation(page)}
                            className={`h-8 w-8 rounded-full ${
                              page === pageAffectation
                                ? "bg-primary text-primary-foreground"
                                : ""
                            }`}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageAffectation(Math.min(totalPages, pageAffectation + 1))}
                      disabled={pageAffectation === totalPages}
                      className="h-8 px-3 rounded-full"
                    >
                      Suivant
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Section Équipes sur site */}
          <div>
            <div className="mb-2">
              <h2 className="text-xl font-semibold">Équipes sur site</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Encadrants affectés au projet. Pour affecter des journaliers
                à une tâche, utilisez le bouton{" "}
                <Users className="inline size-3.5" /> dans l'onglet Avancement.
              </p>
            </div>
          </div>

          {/* Section Effectif */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Effectif sur le chantier
            </h2>

            <div className="grid grid-cols-3 gap-6">
              {/* Agents ITA */}
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Agents ITA
                  </p>
                  <p className="text-4xl font-bold text-green-600">0</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    dont 0 journaliers
                  </p>
                </CardContent>
              </Card>

              {/* Agents prestataires */}
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Agents prestataires
                  </p>
                  <p className="text-4xl font-bold text-purple-600">0</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    non suivis nominativement
                  </p>
                </CardContent>
              </Card>

              {/* Total */}
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Total sur site
                  </p>
                  <p className="text-4xl font-bold">0</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {ongletActif === "budget" && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Suivi budgétaire à venir</p>
          </CardContent>
        </Card>
      )}

      {ongletActif === "jalons" && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Gestion des jalons à venir
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de gestion des tâches */}
      <ModalTache
        projetId={projet.id}
        tache={tacheSelectionnee}
        ouvert={modalTacheOuverte}
        onFermer={fermerModalTache}
        onSuccess={handleSuccesTache}
      />

      {/* Modal d'affectation rapide d'équipe */}
      {tachePourEquipe && (
        <ModalAffecterEquipeRapide
          tacheId={tachePourEquipe.id}
          tacheLibelle={tachePourEquipe.libelle}
          employeIdsActuels={
            tachePourEquipe.affectations?.map((a: any) => a.employeId) || []
          }
          ouvert={modalEquipeRapideOuverte}
          onFermer={fermerModalEquipeRapide}
          onSuccess={handleSuccesEquipe}
        />
      )}
    </div>
  );
}
