"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenirProjet, validerJalonRapide, obtenirMaterielsDisponibles } from "@/lib/actions/projets";
import { toast } from "sonner";
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
  Flag,
  CheckCircle2,
  Clock,
  XCircle,
  Paperclip,
  Link2,
  BarChart3,
  FileText,
  Download,
  Trash2,
  Upload,
  AlertTriangle,
  Truck,
  Camera,
  DollarSign,
} from "lucide-react";
import { StatutProjet } from "@prisma/client";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { ModalAffecterEmploye } from "../_components/modal-affecter-employe";
import { ModaleEditionChamp } from "../_components/modale-edition-champ";
import { ModaleAssignerConducteur } from "../_components/modale-assigner-conducteur";
import { ModalTache } from "../_components/modal-tache";
import { ModalAffecterEquipeRapide } from "../_components/modal-affecter-equipe-rapide";
import { ModalJalon } from "../_components/modal-jalon";
import { ModalNote } from "../_components/modal-note";
import { ModalRisque } from "../_components/modal-risque";
import { ModalDemandeRessource } from "../_components/modal-demande-ressource";
import { AlertDialogConfirm } from "@/components/ui/alert-dialog-confirm";
import { GanttChart } from "../_components/gantt-chart";
import { MeteoChantier } from "../_components/meteo-chantier";

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
    "tableau-bord" | "avancement" | "equipes" | "budget" | "jalons" | "planning" | "notes" | "documents" | "risques" | "photos" | "ressources"
  >("tableau-bord");
  const [rechercheAffectation, setRechercheAffectation] = useState("");
  const [pageAffectation, setPageAffectation] = useState(1);
  const ITEMS_PAR_PAGE = 10;
  const [modalTacheOuverte, setModalTacheOuverte] = useState(false);
  const [tacheSelectionnee, setTacheSelectionnee] = useState<any>(null);
  const [modalJalonOuverte, setModalJalonOuverte] = useState(false);
  const [jalonSelectionne, setJalonSelectionne] = useState<any>(null);
  const [jalonEnCoursValidation, setJalonEnCoursValidation] = useState<string | null>(null);
  const [confirmationValidationOuverte, setConfirmationValidationOuverte] = useState(false);
  const [jalonAValider, setJalonAValider] = useState<{ id: string; libelle: string } | null>(null);
  const [modalNoteOuverte, setModalNoteOuverte] = useState(false);
  const [noteSelectionnee, setNoteSelectionnee] = useState<any>(null);
  const [modalRisqueOuverte, setModalRisqueOuverte] = useState(false);
  const [risqueSelectionne, setRisqueSelectionne] = useState<any>(null);
  const [modalDemandeRessourceOuverte, setModalDemandeRessourceOuverte] = useState(false);
  const [materielsDisponibles, setMaterielsDisponibles] = useState<any[]>([]);

  useEffect(() => {
    chargerProjet();
    chargerMateriels();
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

  async function chargerMateriels() {
    try {
      const data = await obtenirMaterielsDisponibles();
      setMaterielsDisponibles(data);
    } catch (error) {
      console.error("Erreur chargement matériels:", error);
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

  function ouvrirModalCreationJalon() {
    setJalonSelectionne(null);
    setModalJalonOuverte(true);
  }

  function ouvrirModalEditionJalon(jalon: any) {
    setJalonSelectionne(jalon);
    setModalJalonOuverte(true);
  }

  function fermerModalJalon() {
    setModalJalonOuverte(false);
    setJalonSelectionne(null);
  }

  function handleSuccesJalon() {
    chargerProjet();
    fermerModalJalon();
  }

  function handleValiderJalon(jalonId: string, jalonLibelle: string) {
    setJalonAValider({ id: jalonId, libelle: jalonLibelle });
    setConfirmationValidationOuverte(true);
  }

  async function confirmerValidationJalon() {
    if (!jalonAValider) return;

    setConfirmationValidationOuverte(false);
    setJalonEnCoursValidation(jalonAValider.id);

    // Mutation optimiste : mise à jour immédiate de l'UI
    setProjet((prev: any) => ({
      ...prev,
      jalons: prev.jalons.map((j: any) =>
        j.id === jalonAValider.id
          ? { ...j, statut: "VALIDE", valideLe: new Date() }
          : j
      ),
    }));

    try {
      await validerJalonRapide(jalonAValider.id);
      toast.success("Jalon validé avec succès");
      // Pas besoin de recharger, l'UI est déjà à jour
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la validation");
      // En cas d'erreur, recharger pour avoir l'état correct
      await chargerProjet();
    } finally {
      setJalonEnCoursValidation(null);
      setJalonAValider(null);
    }
  }

  function ouvrirModalCreationNote() {
    setNoteSelectionnee(null);
    setModalNoteOuverte(true);
  }

  function ouvrirModalEditionNote(note: any) {
    setNoteSelectionnee(note);
    setModalNoteOuverte(true);
  }

  function fermerModalNote() {
    setModalNoteOuverte(false);
    setNoteSelectionnee(null);
  }

  function handleSuccesNote() {
    chargerProjet();
    fermerModalNote();
  }

  function ouvrirModalCreationRisque() {
    setRisqueSelectionne(null);
    setModalRisqueOuverte(true);
  }

  function ouvrirModalEditionRisque(risque: any) {
    setRisqueSelectionne(risque);
    setModalRisqueOuverte(true);
  }

  function fermerModalRisque() {
    setModalRisqueOuverte(false);
    setRisqueSelectionne(null);
  }

  function handleSuccesRisque() {
    chargerProjet();
    fermerModalRisque();
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

  // Calculs pour l'onglet Équipes
  const affectationsActives = projet.affectations?.filter(
    (a: any) => !a.dateFin || new Date(a.dateFin) >= new Date()
  ) || [];

  const journaliersAffectes = new Set(
    projet.taches?.flatMap((t: any) =>
      t.affectations?.map((a: any) => a.employe?.id).filter(Boolean)
    ) || []
  ).size;

  const totalAgentsITA = affectationsActives.length + journaliersAffectes;

  // Calculs pour les tâches en attente
  const tachesEnRetard = projet.taches?.filter((t: any) =>
    t.dateFin && new Date(t.dateFin) < new Date() && (t.avancementConstate ?? t.avancementPlanifie ?? 0) < 100
  ) || [];

  const tachesNonDemarrees = projet.taches?.filter((t: any) =>
    t.dateDebut && new Date(t.dateDebut) <= new Date() &&
    (t.avancementConstate ?? t.avancementPlanifie ?? 0) === 0 &&
    !(t.dateFin && new Date(t.dateFin) < new Date())
  ) || [];

  const alertesTaches = [...tachesEnRetard, ...tachesNonDemarrees];

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
                <MeteoChantier projet={projet} variant="badge" showDetails />
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
                <h1 className="text-xl font-bold">{projet.nom}</h1>
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
              <p className="text-xl font-bold text-[#111111]">
                {projet.montantMarche
                  ? projet.montantMarche.toLocaleString("fr-FR").replace(/,/g, " ")
                  : "Non défini"}
              </p>
              <p className="text-xs text-muted-foreground">FCFA</p>
              {projet.montantAvenant && (
                <p className="text-xs text-primary mt-2">
                  dont {projet.montantAvenant.toLocaleString("fr-FR").replace(/,/g, " ")} F d'avenant
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barre d'avancement */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Avancement</span>
            <span className="text-lg font-bold">{avancementAffiche} % constaté</span>
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
      <div className="grid grid-cols-2 gap-4">
        {/* Période */}
        <Card>
          <CardContent className="p-4">
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
          </CardContent>
        </Card>

        {/* Conducteur de travaux */}
        <Card>
          <CardContent className="p-4">
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
          </CardContent>
        </Card>
      </div>

      {/* Tâches en attente - Alertes */}
      {alertesTaches.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-orange-600" />
                <h3 className="font-semibold text-sm text-orange-900">
                  Tâches en attente
                  <span className="ml-2 text-xs font-normal text-orange-700">
                    ({alertesTaches.length})
                  </span>
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOngletActif("avancement")}
                className="h-7 text-xs text-orange-700 hover:text-orange-900 hover:bg-orange-100"
              >
                Voir détails
                <ChevronRight className="size-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {/* Tâches en retard */}
              {tachesEnRetard.slice(0, 3).map((tache: any) => (
                <div key={tache.id} className="flex items-start gap-2 text-sm">
                  <XCircle className="size-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">En retard :</span>{" "}
                    {tache.libelle}
                    <span className="text-xs text-muted-foreground ml-2">
                      échéance {format(new Date(tache.dateFin), "dd/MM/yyyy")}
                    </span>
                  </div>
                </div>
              ))}

              {/* Tâches non démarrées */}
              {tachesNonDemarrees.slice(0, 3 - tachesEnRetard.length).map((tache: any) => (
                <div key={tache.id} className="flex items-start gap-2 text-sm">
                  <Clock className="size-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">Non démarrée :</span>{" "}
                    {tache.libelle}
                    <span className="text-xs text-muted-foreground ml-2">
                      démarrage prévu {format(new Date(tache.dateDebut), "dd/MM/yyyy")}
                    </span>
                  </div>
                </div>
              ))}

              {/* Message si plus de 3 alertes */}
              {alertesTaches.length > 3 && (
                <div className="text-xs text-orange-700 mt-2 pt-2 border-t border-orange-200">
                  + {alertesTaches.length - 3} autre{alertesTaches.length - 3 > 1 ? "s" : ""} tâche{alertesTaches.length - 3 > 1 ? "s" : ""} à traiter
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets */}
      <div className="bg-neutral-100/50 rounded-full p-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOngletActif("tableau-bord")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              ongletActif === "tableau-bord"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tableau
          </button>

          <button
            onClick={() => setOngletActif("avancement")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              ongletActif === "avancement"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Avancement
          </button>

          <button
            onClick={() => setOngletActif("equipes")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              ongletActif === "equipes"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Équipes
          </button>

          <button
            onClick={() => setOngletActif("budget")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              ongletActif === "budget"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Budget
          </button>

          <button
            onClick={() => setOngletActif("jalons")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              ongletActif === "jalons"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Jalons
          </button>

          <button
            onClick={() => setOngletActif("planning")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              ongletActif === "planning"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Planning
          </button>

          <button
            onClick={() => setOngletActif("notes")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              ongletActif === "notes"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Notes
          </button>

          <button
            onClick={() => setOngletActif("documents")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              ongletActif === "documents"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Documents
          </button>

          <button
            onClick={() => setOngletActif("risques")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              ongletActif === "risques"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Risques
          </button>

          <button
            onClick={() => setOngletActif("photos")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              ongletActif === "photos"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Photos
          </button>

          <button
            onClick={() => setOngletActif("ressources")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              ongletActif === "ressources"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ressources
          </button>
        </div>
      </div>

      {/* Contenu de l'onglet Tableau de bord */}
      {ongletActif === "tableau-bord" && (
        <div className="space-y-6">
          {/* Météo du chantier */}
          <MeteoChantier projet={projet} variant="card" showDetails />

          {/* KPIs principaux */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Avancement global */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Avancement</p>
                  <TrendingUp className="size-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold tabular-nums">
                  {avancementAffiche} %
                </p>
                <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#13850b] rounded-full transition-all"
                    style={{ width: `${avancementAffiche}%` }}
                  />
                </div>
                {ecartAvancement !== null && ecartAvancement !== 0 && (
                  <p className={`text-xs mt-2 ${ecartAvancement > 0 ? "text-green-600" : "text-orange-500"}`}>
                    {ecartAvancement > 0 ? "+" : ""}{ecartAvancement} pts {ecartAvancement > 0 ? "d'avance" : "de retard"}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tâches */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Tâches</p>
                  <CheckCircle2 className="size-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold tabular-nums">
                  {projet.taches?.filter((t: any) => t.avancement === 100).length || 0}
                  <span className="text-base text-muted-foreground">
                    /{projet.taches?.length || 0}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  terminées
                </p>
              </CardContent>
            </Card>

            {/* Jalons */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Jalons</p>
                  <Flag className="size-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold tabular-nums">
                  {projet.jalons?.filter((j: any) => j.valide).length || 0}
                  <span className="text-base text-muted-foreground">
                    /{projet.jalons?.length || 0}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  validés
                </p>
              </CardContent>
            </Card>

            {/* Risques */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Risques</p>
                  <AlertTriangle className="size-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold tabular-nums">
                  {projet.risquesIncidents?.filter((r: any) =>
                    r.statut === "OUVERT" || r.statut === "EN_TRAITEMENT"
                  ).length || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {projet.risquesIncidents?.filter((r: any) =>
                    r.gravite === "CRITIQUE" || r.gravite === "ELEVEE"
                  ).length || 0} critiques/élevés
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Alertes et points d'attention */}
          {(projet.taches?.some((t: any) =>
              t.dateFin && new Date(t.dateFin) < new Date() && t.avancement < 100
            ) ||
            projet.risquesIncidents?.some((r: any) =>
              (r.gravite === "CRITIQUE" || r.gravite === "ELEVEE") &&
              (r.statut === "OUVERT" || r.statut === "EN_TRAITEMENT")
            ) ||
            projet.jalons?.some((j: any) =>
              !j.valide && j.dateEcheance && new Date(j.dateEcheance) < new Date()
            )) && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="size-4 text-orange-600" />
                  <h3 className="font-semibold text-sm text-orange-900">Points d'attention</h3>
                </div>
                <div className="space-y-2">
                  {/* Tâches en retard */}
                  {projet.taches?.filter((t: any) =>
                    t.dateFin && new Date(t.dateFin) < new Date() && t.avancement < 100
                  ).map((tache: any) => (
                    <div key={tache.id} className="flex items-start gap-2 text-sm">
                      <XCircle className="size-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Tâche en retard :</span>{" "}
                        {tache.libelle}
                        <span className="text-muted-foreground ml-1">
                          (échéance {format(new Date(tache.dateFin), "dd/MM/yyyy")})
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Risques critiques ouverts */}
                  {projet.risquesIncidents?.filter((r: any) =>
                    (r.gravite === "CRITIQUE" || r.gravite === "ELEVEE") &&
                    (r.statut === "OUVERT" || r.statut === "EN_TRAITEMENT")
                  ).map((risque: any) => (
                    <div key={risque.id} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="size-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">
                          {risque.type === "INCIDENT" ? "Incident" : "Risque"} {risque.gravite.toLowerCase()} :
                        </span>{" "}
                        {risque.titre}
                      </div>
                    </div>
                  ))}

                  {/* Jalons en retard */}
                  {projet.jalons?.filter((j: any) =>
                    !j.valide && j.dateEcheance && new Date(j.dateEcheance) < new Date()
                  ).map((jalon: any) => (
                    <div key={jalon.id} className="flex items-start gap-2 text-sm">
                      <Clock className="size-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Jalon non validé :</span>{" "}
                        {jalon.libelle}
                        <span className="text-muted-foreground ml-1">
                          (prévu le {format(new Date(jalon.dateEcheance), "dd/MM/yyyy")})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informations rapides */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Notes épinglées */}
            {projet.notes?.filter((n: any) => n.epinglee).length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="size-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">Notes épinglées</h3>
                  </div>
                  <div className="space-y-3">
                    {projet.notes
                      .filter((n: any) => n.epinglee)
                      .slice(0, 3)
                      .map((note: any) => (
                        <div key={note.id} className="text-sm border-l-2 border-[#13850b] pl-3 py-1">
                          {note.titre && (
                            <p className="font-medium mb-1">{note.titre}</p>
                          )}
                          <p className="text-muted-foreground line-clamp-2">
                            {note.contenu}
                          </p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Équipe */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="size-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Équipe</h3>
                </div>
                <div className="space-y-3">
                  {projet.chefProjetId && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Chef de projet</span>
                      <span className="font-medium">
                        {projet.chefProjet?.prenom} {projet.chefProjet?.nom}
                      </span>
                    </div>
                  )}
                  {projet.conducteurId && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Conducteur</span>
                      <span className="font-medium">
                        {projet.conducteur?.prenom} {projet.conducteur?.nom}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Personnel affecté</span>
                    <span className="font-medium tabular-nums">
                      {projet.affectations?.filter((a: any) => !a.dateFin).length || 0} personnes
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ressources matérielles */}
            {projet.affectationsMateriel?.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="size-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">Ressources matérielles</h3>
                  </div>
                  <div className="space-y-3">
                    {projet.affectationsMateriel
                      .filter((a: any) => {
                        const now = new Date();
                        return new Date(a.dateDebut) <= now && new Date(a.dateFin) >= now;
                      })
                      .slice(0, 5)
                      .map((affectation: any) => (
                        <div key={affectation.id} className="flex items-center justify-between text-sm">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{affectation.materiel.designation}</p>
                            <p className="text-xs text-muted-foreground">
                              {affectation.materiel.codeIta}
                              {affectation.materiel.immatriculation && ` • ${affectation.materiel.immatriculation}`}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs ml-2 flex-shrink-0"
                          >
                            {affectation.materiel.type}
                          </Badge>
                        </div>
                      ))}
                    {projet.affectationsMateriel.filter((a: any) => {
                      const now = new Date();
                      return new Date(a.dateDebut) <= now && new Date(a.dateFin) >= now;
                    }).length === 0 && (
                      <p className="text-sm text-muted-foreground">Aucun matériel actuellement affecté</p>
                    )}
                  </div>
                  {projet.affectationsMateriel.filter((a: any) => {
                    const now = new Date();
                    return new Date(a.dateDebut) <= now && new Date(a.dateFin) >= now;
                  }).length > 5 && (
                    <p className="text-xs text-muted-foreground mt-3">
                      +{projet.affectationsMateriel.filter((a: any) => {
                        const now = new Date();
                        return new Date(a.dateDebut) <= now && new Date(a.dateFin) >= now;
                      }).length - 5} autre(s)
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Documents récents */}
          {projet.documents?.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Paperclip className="size-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">Documents récents</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOngletActif("documents")}
                    className="text-sm"
                  >
                    Voir tout
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {projet.documents.slice(0, 5).map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Paperclip className="size-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{doc.nomFichier}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(doc.deposeLe), "dd MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Contenu de l'onglet Avancement */}
      {ongletActif === "avancement" && (
        <div className="space-y-4">
          {/* En-tête Tâches */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Tâches</h2>
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
                    Avancement
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground uppercase">
                    Équipe
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground uppercase w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {projet.taches && projet.taches.length > 0 ? (
                  projet.taches.map((tache: any) => {
                    return (
                      <tr
                        key={tache.id}
                        className="border-b hover:bg-muted/30"
                      >
                        <td className="py-3 px-4 text-sm">
                          <div>{tache.libelle}</div>
                          {tache.predecesseur && (
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                              <Link2 className="size-3" />
                              <span>Dépend de : {tache.predecesseur.libelle}</span>
                            </div>
                          )}
                        </td>
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
                        <td className="py-3 px-4 text-sm">
                          {tache.affectations && tache.affectations.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {tache.affectations.slice(0, 3).map((affectation: any) => (
                                <span
                                  key={affectation.employe.id}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary"
                                >
                                  {affectation.employe.prenom} {affectation.employe.nom}
                                </span>
                              ))}
                              {tache.affectations.length > 3 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-muted text-muted-foreground">
                                  +{tache.affectations.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => ouvrirModalEditionTache(tache)}
                              className="h-8 w-8 p-0 hover:bg-muted"
                              title="Modifier la tâche"
                            >
                              <Pencil className="size-4 text-muted-foreground" />
                            </Button>
                            <ModalAffecterEquipeRapide
                              tacheId={tache.id}
                              tacheLibelle={tache.libelle}
                              projetId={projet.id}
                              projetCode={projet.code}
                              projetNom={projet.nom}
                              employeIdsActuels={
                                tache.affectations?.map((a: any) => a.employe.id) || []
                              }
                            >
                              <Button
                                size="sm"
                                className="h-7 px-3 text-xs bg-[#13850b] hover:bg-[#0f6909] text-white rounded-full"
                                title="Composer l'équipe rapidement"
                              >
                                Équipe
                              </Button>
                            </ModalAffecterEquipeRapide>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      Aucune tâche créée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onglet Équipes */}
      {ongletActif === "equipes" && (
        <div className="space-y-4">
          {/* Encadré Chaîne fonctionnelle */}
          <div className="rounded-lg bg-gray-200 p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-bold text-foreground">
                  Chaîne fonctionnelle
                </h3>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Les affectations de chantier portent la chaîne{" "}
                    <span className="font-semibold text-foreground">fonctionnelle</span>{" "}
                    : qui vise les relevés d'activité, qui organise le planning.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Elles ne portent{" "}
                    <span className="font-semibold text-foreground">pas</span>{" "}
                    la chaîne hiérarchique. Un chef de chantier relève du
                    Directeur Technique pour ses congés, et du Conducteur de
                    Travaux pour ses relevés.
                  </p>
                  <div className="mt-3 pt-2 border-t border-border">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-2">
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
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">Affectations</h2>
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
            <div className="mb-3">
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
                        className="py-6 text-center text-sm text-muted-foreground"
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
              <h2 className="text-base font-semibold">Équipes sur site</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Encadrants affectés au projet. Pour affecter des journaliers
                à une tâche, utilisez le badge{" "}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#13850b] text-white">
                  Équipe
                </span>{" "}
                dans l'onglet Avancement.
              </p>
            </div>
          </div>

          {/* Section Effectif */}
          <div>
            <h2 className="text-base font-semibold mb-3">
              Effectif sur le chantier
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Encadrants */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Encadrants affectés
                  </p>
                  <p className="text-2xl font-bold text-[#13850b]">
                    {affectationsActives.length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {affectationsActives.length === 0
                      ? "Aucun encadrant"
                      : affectationsActives.length === 1
                      ? "Chef de chantier, conducteur..."
                      : "Chefs de chantier, conducteurs..."}
                  </p>
                </CardContent>
              </Card>

              {/* Journaliers */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Journaliers sur tâches
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {journaliersAffectes}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {journaliersAffectes === 0
                      ? "Aucun journalier affecté"
                      : `Affecté${journaliersAffectes > 1 ? 's' : ''} à des tâches actives`}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {ongletActif === "budget" && (
        <div className="space-y-4">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Budget projet</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Suivi financier et postes de dépenses
              </p>
            </div>
          </div>

          {/* Vue d'ensemble financière */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Montant du marché
                  </p>
                  <DollarSign className="size-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold tabular-nums text-[#111111]">
                  {projet.montantMarche
                    ? new Intl.NumberFormat("fr-FR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(Number(projet.montantMarche))
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">FCFA</p>
                <div className="mt-4">
                  <ModaleEditionChamp
                    projetId={projet.id}
                    champ="montantMarche"
                    label="Montant du marché (FCFA)"
                    valeurActuelle={projet.montantMarche}
                    type="number"
                    onSuccess={chargerProjet}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Avancement projet
                  </p>
                  <TrendingUp className="size-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold tabular-nums">
                  {avancementAffiche} %
                </p>
                <p className="text-xs text-muted-foreground mt-1">Avancement constaté</p>
                {projet.montantMarche && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Valeur réalisée estimée</span>
                      <span className="font-semibold tabular-nums">
                        {new Intl.NumberFormat("fr-FR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format((Number(projet.montantMarche) * avancementAffiche) / 100)} F
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Répartition par poste */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Répartition budgétaire indicative</h3>

              <div className="space-y-4">
                {/* Main d'œuvre */}
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium">Main d'œuvre</p>
                      <p className="text-xs text-muted-foreground">
                        {projet.affectations?.filter((a: any) => !a.dateFin).length || 0} personnes actuellement affectées
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">30 %</p>
                    <p className="text-xs text-muted-foreground">Estimation standard</p>
                  </div>
                </div>

                {/* Matériaux */}
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div>
                      <p className="font-medium">Matériaux et fournitures</p>
                      <p className="text-xs text-muted-foreground">
                        Dépenses à suivre via module M8 Achats
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">40 %</p>
                    <p className="text-xs text-muted-foreground">Estimation standard</p>
                  </div>
                </div>

                {/* Matériel */}
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <div>
                      <p className="font-medium">Matériel et engins</p>
                      <p className="text-xs text-muted-foreground">
                        {projet.affectationsMateriel?.filter((a: any) => {
                          const now = new Date();
                          return new Date(a.dateDebut) <= now && new Date(a.dateFin) >= now;
                        }).length || 0} équipements actuellement affectés
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">15 %</p>
                    <p className="text-xs text-muted-foreground">Estimation standard</p>
                  </div>
                </div>

                {/* Sous-traitance */}
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <div>
                      <p className="font-medium">Sous-traitance</p>
                      <p className="text-xs text-muted-foreground">
                        Prestations externes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">10 %</p>
                    <p className="text-xs text-muted-foreground">Estimation standard</p>
                  </div>
                </div>

                {/* Divers */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    <div>
                      <p className="font-medium">Divers et imprévus</p>
                      <p className="text-xs text-muted-foreground">
                        Frais administratifs, transport, etc.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">5 %</p>
                    <p className="text-xs text-muted-foreground">Estimation standard</p>
                  </div>
                </div>
              </div>

              {/* Note explicative */}
              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-900 mb-1">Suivi des dépenses réelles à venir</p>
                    <p className="text-orange-800">
                      Le suivi détaillé des dépenses sera disponible avec l'intégration des modules :
                      M8 (Achats), M9 (Transports), M19 (Relevés d'activité), M21 (Paie).
                      Les pourcentages ci-dessus sont des estimations standards pour le BTP en Côte d'Ivoire.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {ongletActif === "jalons" && (
        <div className="space-y-4">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Jalons du projet</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Étapes clés et points de validation
              </p>
            </div>
            <Button
              onClick={ouvrirModalCreationJalon}
              className="gap-2 rounded-full bg-[#13850b] hover:bg-[#0f6909] text-white"
            >
              <Plus className="size-4" />
              Nouveau jalon
            </Button>
          </div>

          {/* Timeline verticale */}
          <Card>
            <CardContent className="p-4">
              {!projet.jalons || projet.jalons.length === 0 ? (
                <div className="py-6 text-center">
                  <Flag className="size-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Aucun jalon défini
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ajoutez des jalons pour marquer les étapes importantes du projet
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Ligne verticale */}
                  <div className="absolute left-[17px] top-0 bottom-0 w-0.5 bg-border" />

                  {/* Liste des jalons */}
                  <div className="space-y-6">
                    {projet.jalons.map((jalon: any, index: number) => {
                      const estPasse = new Date(jalon.datePrevisionnelle) < new Date();
                      const estValide = jalon.statut === "VALIDE";
                      const estAbandonne = jalon.statut === "ABANDONNE";
                      const estEnAttente = jalon.statut === "ATTENTE";

                      return (
                        <div key={jalon.id} className="relative pl-12">
                          {/* Indicateur de statut */}
                          <div className="absolute left-0 top-1">
                            {estValide ? (
                              <div className="size-[35px] rounded-full bg-[#13850b] flex items-center justify-center ring-4 ring-background">
                                <CheckCircle2 className="size-5 text-white" />
                              </div>
                            ) : estAbandonne ? (
                              <div className="size-[35px] rounded-full bg-red-500 flex items-center justify-center ring-4 ring-background">
                                <XCircle className="size-5 text-white" />
                              </div>
                            ) : (
                              <div className="size-[35px] rounded-full bg-orange-500 flex items-center justify-center ring-4 ring-background">
                                <Clock className="size-5 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Contenu du jalon */}
                          <div
                            onClick={() => ouvrirModalEditionJalon(jalon)}
                            className="group rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-base">
                                    {jalon.libelle}
                                  </h3>
                                  <Badge
                                    style={{
                                      backgroundColor: estValide
                                        ? "#13850b20"
                                        : estAbandonne
                                        ? "#ef444420"
                                        : "#f9731620",
                                      color: estValide
                                        ? "#13850b"
                                        : estAbandonne
                                        ? "#ef4444"
                                        : "#f97316",
                                    }}
                                    className="text-xs"
                                  >
                                    {estValide
                                      ? "Validé"
                                      : estAbandonne
                                      ? "Abandonné"
                                      : "En attente"}
                                  </Badge>
                                </div>

                                {jalon.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {jalon.description}
                                  </p>
                                )}

                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1.5">
                                    <CalendarIcon className="size-4" />
                                    <span>
                                      {format(
                                        new Date(jalon.datePrevisionnelle),
                                        "dd MMM yyyy",
                                        { locale: fr }
                                      )}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <User className="size-4" />
                                    <span>
                                      {jalon.typeValidateur === "INTERNE"
                                        ? "Validation interne"
                                        : jalon.typeValidateur === "MAITRE_OEUVRE"
                                        ? "Maître d'œuvre"
                                        : "Maître d'ouvrage"}
                                      {jalon.validateurExterne &&
                                        ` · ${jalon.validateurExterne}`}
                                    </span>
                                  </div>

                                  {(jalon as any).document && (
                                    <div className="flex items-center gap-1.5 text-[#13850b]">
                                      <Paperclip className="size-4" />
                                      <span className="font-medium">Pièce jointe</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Bouton Valider (visible uniquement si ATTENTE) */}
                                {estEnAttente && (
                                  <Button
                                    size="sm"
                                    disabled={jalonEnCoursValidation === jalon.id}
                                    className="h-8 px-3 text-xs bg-[#13850b] hover:bg-[#0f6909] text-white rounded-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleValiderJalon(jalon.id, jalon.libelle);
                                    }}
                                  >
                                    {jalonEnCoursValidation === jalon.id ? (
                                      <CheckCircle2 className="size-3 mr-1 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="size-3 mr-1" />
                                    )}
                                    Valider
                                  </Button>
                                )}

                                {/* Bouton Modifier */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    ouvrirModalEditionJalon(jalon);
                                  }}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onglet Planning */}
      {ongletActif === "planning" && (
        <div className="space-y-4">
          {/* En-tête */}
          <div>
            <h2 className="text-lg font-semibold">Planning Gantt</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Vue chronologique des tâches et jalons du projet
            </p>
          </div>

          {/* Chart Gantt */}
          <Card>
            <CardContent className="p-4">
              {(!projet.taches || projet.taches.length === 0) && (!projet.jalons || projet.jalons.length === 0) ? (
                <div className="py-6 text-center">
                  <BarChart3 className="size-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Aucune tâche ou jalon défini
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ajoutez des tâches dans l'onglet Avancement et des jalons dans l'onglet Jalons pour visualiser le planning
                  </p>
                </div>
              ) : (
                <GanttChart
                  taches={[
                    ...(projet.taches || []).map((t: any) => ({
                      id: t.id,
                      libelle: t.libelle,
                      dateDebut: new Date(t.dateDebut),
                      dateFin: new Date(t.dateFin),
                      avancementPlanifie: t.avancementPlanifie,
                      type: "tache" as const,
                      statut: t.statut,
                    })),
                    ...(projet.jalons || []).map((j: any) => ({
                      id: j.id,
                      libelle: j.libelle,
                      dateDebut: new Date(j.datePrevisionnelle),
                      dateFin: new Date(j.datePrevisionnelle),
                      avancementPlanifie: 100,
                      type: "jalon" as const,
                      statut: j.statut,
                    })),
                  ]}
                  onClickTache={(tache) => {
                    if (tache.type === "tache") {
                      const tacheTrouvee = projet.taches.find((t: any) => t.id === tache.id);
                      if (tacheTrouvee) {
                        ouvrirModalEditionTache(tacheTrouvee);
                      }
                    } else {
                      const jalonTrouve = projet.jalons.find((j: any) => j.id === tache.id);
                      if (jalonTrouve) {
                        ouvrirModalEditionJalon(jalonTrouve);
                      }
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onglet Notes */}
      {ongletActif === "notes" && (
        <div className="space-y-4">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Notes et observations</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Journal de bord du projet
              </p>
            </div>
            <Button
              onClick={ouvrirModalCreationNote}
              className="gap-2 rounded-full bg-[#13850b] hover:bg-[#0f6909] text-white"
            >
              <Plus className="size-4" />
              Nouvelle note
            </Button>
          </div>

          {/* Liste des notes */}
          <Card>
            <CardContent className="p-4">
              {!projet.notes || projet.notes.length === 0 ? (
                <div className="py-6 text-center">
                  <FileText className="size-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Aucune note enregistrée
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ajoutez des observations, comptes-rendus ou notes techniques
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projet.notes.map((note: any) => {
                    const typeLabels: Record<string, string> = {
                      GENERALE: "Générale",
                      TECHNIQUE: "Technique",
                      QUALITE: "Qualité",
                      SECURITE: "Sécurité",
                      ADMINISTRATIVE: "Administrative",
                      REUNION: "Réunion",
                    };

                    const typeColors: Record<string, string> = {
                      GENERALE: "#6B7280",
                      TECHNIQUE: "#3B82F6",
                      QUALITE: "#10B981",
                      SECURITE: "#EF4444",
                      ADMINISTRATIVE: "#8B5CF6",
                      REUNION: "#F59E0B",
                    };

                    return (
                      <div
                        key={note.id}
                        className="rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              {note.epinglee && (
                                <div className="size-2 rounded-full bg-[#13850b]" />
                              )}
                              {note.titre && (
                                <h3 className="font-semibold text-base">{note.titre}</h3>
                              )}
                              <Badge
                                style={{
                                  backgroundColor: `${typeColors[note.type]}20`,
                                  color: typeColors[note.type],
                                }}
                                className="text-xs"
                              >
                                {typeLabels[note.type]}
                              </Badge>
                            </div>

                            <p className="text-sm whitespace-pre-wrap">
                              {note.contenu}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <User className="size-3" />
                                <span>
                                  {note.auteur.prenom} {note.auteur.nom}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="size-3" />
                                <span>
                                  {format(new Date(note.creeLe), "dd MMM yyyy à HH:mm", { locale: fr })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => ouvrirModalEditionNote(note)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onglet Documents */}
      {ongletActif === "documents" && (
        <div className="space-y-4">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Documents du projet</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Plans, contrats, rapports et autres documents
              </p>
            </div>
            <Button
              className="gap-2 rounded-full bg-[#13850b] hover:bg-[#0f6909] text-white"
            >
              <Upload className="size-4" />
              Ajouter un document
            </Button>
          </div>

          {/* Liste des documents */}
          <Card>
            <CardContent className="p-4">
              {!projet.documents || projet.documents.length === 0 ? (
                <div className="py-6 text-center">
                  <Paperclip className="size-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Aucun document enregistré
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ajoutez des plans, contrats, rapports ou autres documents liés au projet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projet.documents.map((doc: any) => {
                    const categorieLabels: Record<string, string> = {
                      PLAN: "Plan",
                      CONTRAT: "Contrat",
                      RAPPORT: "Rapport",
                      DEVIS: "Devis",
                      AUTORISATION: "Autorisation",
                      AUTRE: "Autre",
                    };

                    const categorieColors: Record<string, string> = {
                      PLAN: "#3B82F6",
                      CONTRAT: "#10B981",
                      RAPPORT: "#8B5CF6",
                      DEVIS: "#F59E0B",
                      AUTORISATION: "#EF4444",
                      AUTRE: "#6B7280",
                    };

                    const formatTaille = (bytes: number) => {
                      if (bytes < 1024) return `${bytes} o`;
                      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
                      return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
                    };

                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="size-10 rounded-md bg-muted flex items-center justify-center">
                            <Paperclip className="size-5 text-muted-foreground" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-sm truncate">
                                {doc.nomFichier}
                              </h3>
                              <Badge
                                style={{
                                  backgroundColor: `${categorieColors[doc.categorie]}20`,
                                  color: categorieColors[doc.categorie],
                                }}
                                className="text-xs"
                              >
                                {categorieLabels[doc.categorie]}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{formatTaille(doc.taille)}</span>
                              <span>•</span>
                              <span>
                                {format(new Date(doc.deposeLe), "dd MMM yyyy", { locale: fr })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Download className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onglet Risques et Incidents */}
      {ongletActif === "risques" && (
        <div className="space-y-4">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Risques et incidents</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Suivi des risques identifiés et incidents survenus
              </p>
            </div>
            <Button
              onClick={ouvrirModalCreationRisque}
              className="gap-2 rounded-full bg-[#13850b] hover:bg-[#0f6909] text-white"
            >
              <Plus className="size-4" />
              Nouveau risque/incident
            </Button>
          </div>

          {/* Liste des risques */}
          <Card>
            <CardContent className="p-4">
              {!projet.risquesIncidents || projet.risquesIncidents.length === 0 ? (
                <div className="py-6 text-center">
                  <AlertTriangle className="size-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Aucun risque ou incident enregistré
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Identifiez les risques potentiels et suivez les incidents survenus
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projet.risquesIncidents.map((risque: any) => {
                    const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
                      RISQUE: { label: "Risque", color: "#F59E0B", bg: "#F59E0B20" },
                      INCIDENT: { label: "Incident", color: "#EF4444", bg: "#EF444420" },
                    };

                    const graviteConfig: Record<string, { label: string; color: string }> = {
                      FAIBLE: { label: "Faible", color: "#10B981" },
                      MOYENNE: { label: "Moyenne", color: "#F59E0B" },
                      ELEVEE: { label: "Élevée", color: "#EF4444" },
                      CRITIQUE: { label: "Critique", color: "#DC2626" },
                    };

                    const statutConfig: Record<string, { label: string; color: string; bg: string }> = {
                      OUVERT: { label: "Ouvert", color: "#3B82F6", bg: "#3B82F620" },
                      EN_TRAITEMENT: { label: "En traitement", color: "#F59E0B", bg: "#F59E0B20" },
                      RESOLU: { label: "Résolu", color: "#10B981", bg: "#10B98120" },
                      CLOTURE: { label: "Clôturé", color: "#6B7280", bg: "#6B728020" },
                    };

                    return (
                      <div
                        key={risque.id}
                        className="rounded-lg border p-4 space-y-3"
                      >
                        {/* En-tête */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-base">{risque.titre}</h3>
                              <Badge
                                style={{
                                  backgroundColor: typeConfig[risque.type].bg,
                                  color: typeConfig[risque.type].color,
                                }}
                                className="text-xs"
                              >
                                {typeConfig[risque.type].label}
                              </Badge>
                              <Badge
                                style={{
                                  backgroundColor: `${graviteConfig[risque.gravite].color}20`,
                                  color: graviteConfig[risque.gravite].color,
                                }}
                                className="text-xs"
                              >
                                {graviteConfig[risque.gravite].label}
                              </Badge>
                              <Badge
                                style={{
                                  backgroundColor: statutConfig[risque.statut].bg,
                                  color: statutConfig[risque.statut].color,
                                }}
                                className="text-xs"
                              >
                                {statutConfig[risque.statut].label}
                              </Badge>
                            </div>

                            {risque.description && (
                              <p className="text-sm text-muted-foreground">
                                {risque.description}
                              </p>
                            )}

                            {risque.mesures && (
                              <div className="bg-muted/50 rounded-md p-3">
                                <p className="text-xs font-medium mb-1">Mesures prises :</p>
                                <p className="text-sm">{risque.mesures}</p>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Clock className="size-3" />
                                <span>
                                  Identifié le {format(new Date(risque.dateIdentification), "dd MMM yyyy", { locale: fr })}
                                </span>
                              </div>
                              {risque.responsable && (
                                <div className="flex items-center gap-1.5">
                                  <User className="size-3" />
                                  <span>
                                    Responsable : {risque.responsable.prenom} {risque.responsable.nom}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => ouvrirModalEditionRisque(risque)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contenu de l'onglet Photos */}
      {ongletActif === "photos" && (
        <div className="space-y-4">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Photos du projet</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Galerie photos de suivi du chantier
              </p>
            </div>
            <Button
              disabled
              className="gap-2 rounded-full bg-muted text-muted-foreground cursor-not-allowed"
              title="Upload disponible prochainement (Supabase Storage à configurer)"
            >
              <Upload className="size-4" />
              Ajouter des photos
            </Button>
          </div>

          {/* Galerie photos */}
          {(() => {
            const photos = projet.documents?.filter((d: any) => d.typeMime?.startsWith("image/")) || [];

            if (photos.length === 0) {
              return (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Camera className="size-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground mb-1">
                        Aucune photo disponible
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Les photos de suivi du chantier apparaîtront ici
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo: any) => (
                  <Card key={photo.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      {/* Image placeholder */}
                      <div className="aspect-square bg-muted flex items-center justify-center relative">
                        <Camera className="size-12 text-muted-foreground opacity-30" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs font-medium truncate">{photo.nomFichier}</p>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3 border-t">
                        <p className="text-sm font-medium truncate mb-1">{photo.nomFichier}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{format(new Date(photo.deposeLe), "dd/MM/yyyy", { locale: fr })}</span>
                          <span>{(photo.taille / 1024).toFixed(0)} Ko</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}

          {/* Message info upload */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Upload de photos à venir</p>
                  <p className="text-muted-foreground">
                    L'ajout de photos sera disponible après la configuration du stockage Supabase.
                    Les photos seront automatiquement optimisées et sécurisées.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contenu de l'onglet Ressources */}
      {ongletActif === "ressources" && (
        <div className="space-y-4">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Ressources matérielles</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Matériel et engins affectés au projet
              </p>
            </div>
            <Button
              onClick={() => setModalDemandeRessourceOuverte(true)}
              className="rounded-full bg-[#13850b] hover:bg-[#0f6909] text-white"
            >
              <Plus className="size-4 mr-2" />
              Demander une ressource
            </Button>
          </div>

          {/* Demandes en attente/soumises */}
          {projet?.demandesRessource && projet.demandesRessource.filter((d: any) =>
            ["BROUILLON", "SOUMISE", "VALIDEE_N1"].includes(d.statut)
          ).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Demandes en cours</h3>
              {projet.demandesRessource
                .filter((d: any) => ["BROUILLON", "SOUMISE", "VALIDEE_N1"].includes(d.statut))
                .map((demande: any) => (
                  <Card key={demande.id} className="border-blue-200 bg-blue-50/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                demande.statut === "BROUILLON"
                                  ? "border-gray-300 text-gray-700"
                                  : demande.statut === "SOUMISE"
                                  ? "border-blue-300 text-blue-700"
                                  : "border-green-300 text-green-700"
                              }
                            >
                              {demande.statut === "BROUILLON" && "Brouillon"}
                              {demande.statut === "SOUMISE" && "Soumise"}
                              {demande.statut === "VALIDEE_N1" && "Validée N+1"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(demande.creeLe), "d MMM yyyy", { locale: fr })}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{demande.motif}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Du {format(new Date(demande.dateDebut), "d MMM", { locale: fr })} au{" "}
                              {format(new Date(demande.dateFin), "d MMM yyyy", { locale: fr })}
                            </span>
                            <span>• {demande.lignes.length} matériel(s) demandé(s)</span>
                            {demande.lieuLivraison && <span>• {demande.lieuLivraison}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {/* Liste des affectations */}
          {projet?.affectationsMateriel && projet.affectationsMateriel.length > 0 ? (
            <div className="space-y-4">
              {projet.affectationsMateriel
                .sort((a: any, b: any) => {
                  const aDebut = new Date(a.dateDebut);
                  const bDebut = new Date(b.dateDebut);
                  return bDebut.getTime() - aDebut.getTime();
                })
                .map((affectation: any) => {
                  const now = new Date();
                  const dateDebut = new Date(affectation.dateDebut);
                  const dateFin = new Date(affectation.dateFin);
                  const estActif = dateDebut <= now && dateFin >= now;
                  const estFutur = dateDebut > now;
                  const estPasse = dateFin < now;

                  return (
                    <Card key={affectation.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          {/* Informations principales */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start gap-3">
                              <Truck className="size-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">
                                    {affectation.materiel.designation}
                                  </h3>
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-mono"
                                  >
                                    {affectation.materiel.codeIta}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                  <span>Type : {affectation.materiel.type}</span>
                                  {affectation.materiel.marque && (
                                    <span>
                                      {affectation.materiel.marque}
                                      {affectation.materiel.modele && ` ${affectation.materiel.modele}`}
                                    </span>
                                  )}
                                  {affectation.materiel.immatriculation && (
                                    <span className="font-mono">
                                      {affectation.materiel.immatriculation}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Période d'affectation */}
                            <div className="flex items-center gap-4 text-sm pl-8">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="size-4 text-muted-foreground" />
                                <span>
                                  Du{" "}
                                  <span className="font-medium">
                                    {format(dateDebut, "d MMM yyyy", { locale: fr })}
                                  </span>
                                  {" "}au{" "}
                                  <span className="font-medium">
                                    {format(dateFin, "d MMM yyyy", { locale: fr })}
                                  </span>
                                </span>
                              </div>
                              {affectation.commentaire && (
                                <span className="text-muted-foreground">
                                  • {affectation.commentaire}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Statut et badges */}
                          <div className="flex flex-col items-end gap-2">
                            {estActif && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle2 className="size-3 mr-1" />
                                En cours
                              </Badge>
                            )}
                            {estFutur && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                <Clock className="size-3 mr-1" />
                                À venir
                              </Badge>
                            )}
                            {estPasse && (
                              <Badge variant="outline" className="text-muted-foreground">
                                Terminée
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={
                                affectation.materiel.statut === "DISPONIBLE"
                                  ? "border-green-300 text-green-700"
                                  : affectation.materiel.statut === "EN_SERVICE"
                                  ? "border-blue-300 text-blue-700"
                                  : affectation.materiel.statut === "EN_MAINTENANCE"
                                  ? "border-orange-300 text-orange-700"
                                  : "border-red-300 text-red-700"
                              }
                            >
                              {affectation.materiel.statut === "DISPONIBLE" && "Disponible"}
                              {affectation.materiel.statut === "EN_SERVICE" && "En service"}
                              {affectation.materiel.statut === "EN_MAINTENANCE" && "Maintenance"}
                              {affectation.materiel.statut === "HORS_SERVICE" && "Hors service"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Truck className="size-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-sm font-semibold mb-2">
                  Aucune ressource affectée
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Ce projet n'a pas encore de matériel ou d'engins affectés.
                </p>
                <p className="text-xs text-muted-foreground">
                  La gestion des affectations de matériel se fait via le module{" "}
                  <span className="font-medium">M13 — Logistique</span>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Note informative */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">
                    Gestion via le module Logistique
                  </p>
                  <p className="text-blue-800">
                    L'affectation et la désaffectation de matériel se font via le module{" "}
                    <span className="font-medium">M13 — Logistique</span>.
                    Cet onglet affiche uniquement les ressources actuellement liées au projet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de gestion des tâches */}
      <ModalTache
        projetId={projet.id}
        projetCode={projet.code}
        projetNom={projet.nom}
        tache={tacheSelectionnee}
        ouvert={modalTacheOuverte}
        onFermer={fermerModalTache}
        onSuccess={handleSuccesTache}
      />

      {/* Modal de gestion des jalons */}
      <ModalJalon
        projetId={projet.id}
        projetCode={projet.code}
        projetNom={projet.nom}
        jalon={jalonSelectionne}
        ouvert={modalJalonOuverte}
        onFermer={fermerModalJalon}
        onSuccess={handleSuccesJalon}
      />

      {/* Confirmation de validation de jalon */}
      <AlertDialogConfirm
        open={confirmationValidationOuverte}
        onOpenChange={setConfirmationValidationOuverte}
        onConfirm={confirmerValidationJalon}
        titre="Valider le jalon"
        description={`Êtes-vous sûr de vouloir valider le jalon "${jalonAValider?.libelle}" ? Cette action enregistrera la date et l'auteur de validation.`}
        labelConfirm="Valider"
        labelCancel="Annuler"
      />

      {/* Modal de gestion des notes */}
      {modalNoteOuverte && (
        <ModalNote
          projetId={projet.id}
          note={noteSelectionnee}
          onClose={fermerModalNote}
          onSuccess={handleSuccesNote}
        />
      )}

      {/* Modal de gestion des risques/incidents */}
      {modalRisqueOuverte && (
        <ModalRisque
          projetId={projet.id}
          risque={risqueSelectionne}
          onClose={fermerModalRisque}
          onSuccess={handleSuccesRisque}
        />
      )}

      {/* Modal de demande de ressource */}
      <ModalDemandeRessource
        projetId={projet.id}
        projetCode={projet.code}
        projetNom={projet.nom}
        ouvert={modalDemandeRessourceOuverte}
        taches={projet?.taches || []}
        materiels={materielsDisponibles}
        onClose={() => setModalDemandeRessourceOuverte(false)}
        onSuccess={() => {
          chargerProjet();
          setModalDemandeRessourceOuverte(false);
        }}
      />
    </div>
  );
}
