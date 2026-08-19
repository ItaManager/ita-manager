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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  X,
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
  Info,
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
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  CardIndicateur,
  MiniGraphBarres,
  MiniGraphCirculaire,
  MiniGraphProgression,
} from "@/components/indicateurs";

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
  const [filtreAffectation, setFiltreAffectation] = useState<"tous" | "actifs" | "termines">("actifs");
  const [pageAffectation, setPageAffectation] = useState(1);
  const [limitAffectation, setLimitAffectation] = useState(20);
  const [rechercheTache, setRechercheTache] = useState("");
  const [filtreTache, setFiltreTache] = useState<"toutes" | "en-cours" | "terminees" | "en-retard">("toutes");
  const [pageTache, setPageTache] = useState(1);
  const [limitTache, setLimitTache] = useState(20);
  const [rechercheNote, setRechercheNote] = useState("");
  const [filtreNote, setFiltreNote] = useState<"toutes" | "generale" | "technique" | "qualite" | "securite" | "administrative" | "reunion">("toutes");
  const [pageNote, setPageNote] = useState(1);
  const [limitNote, setLimitNote] = useState(20);
  const [rechercheDocument, setRechercheDocument] = useState("");
  const [filtreDocument, setFiltreDocument] = useState<"tous" | "plan" | "contrat" | "rapport" | "devis" | "autorisation" | "autre">("tous");
  const [pageDocument, setPageDocument] = useState(1);
  const [limitDocument, setLimitDocument] = useState(20);
  const [rechercheRisque, setRechercheRisque] = useState("");
  const [filtreRisque, setFiltreRisque] = useState<"tous" | "risque" | "incident">("tous");
  const [filtreGravite, setFiltreGravite] = useState<"toutes" | "faible" | "moyenne" | "elevee" | "critique">("toutes");
  const [filtreStatut, setFiltreStatut] = useState<"tous" | "ouvert" | "en_traitement" | "resolu" | "cloture">("tous");
  const [pageRisque, setPageRisque] = useState(1);
  const [limitRisque, setLimitRisque] = useState(20);
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
      <div className="bg-white rounded-xl border border-[#0000001a]">
        <Accordion type="single" collapsible defaultValue="infos">
          <AccordionItem value="infos" className="border-none">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <h2 className="text-lg font-semibold text-[#18181a]">
                {projet.nom}
              </h2>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
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

              {/* Période et Conducteur */}
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-6">
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
                      <p className="text-sm font-medium">
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
                          className={`text-xs mt-1 ${
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
                    <p className="text-sm text-muted-foreground">Non définie</p>
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
                    <p className="text-sm font-medium">
                      {projet.conducteur.prenom} {projet.conducteur.nom}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Non assigné</p>
                  )}
                </div>
              </div>

              {/* Avancement */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#18181a]">
                    Avancement
                  </h3>
                  <span className="text-sm font-medium">{avancementAffiche} % constaté</span>
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
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Tâches en attente */}
      {(() => {
        const tachesEnRetard = projet.taches?.filter((t: any) =>
          t.dateFin && new Date(t.dateFin) < new Date() && t.avancement < 100
        ) || [];
        const risquesCritiques = projet.risquesIncidents?.filter((r: any) =>
          (r.gravite === "CRITIQUE" || r.gravite === "ELEVEE") &&
          (r.statut === "OUVERT" || r.statut === "EN_TRAITEMENT")
        ) || [];
        const jalonsEnRetard = projet.jalons?.filter((j: any) =>
          !j.valide && j.dateEcheance && new Date(j.dateEcheance) < new Date()
        ) || [];
        const totalTaches = tachesEnRetard.length + risquesCritiques.length + jalonsEnRetard.length;

        return (
          <div className="bg-white rounded-xl border border-[#0000001a]">
            <Accordion type="single" collapsible defaultValue="taches">
              <AccordionItem value="taches" className="border-none">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <h2 className="text-lg font-semibold text-[#18181a]">
                    Tâches en attente {totalTaches > 0 && `(${totalTaches})`}
                  </h2>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  {totalTaches === 0 ? (
                    <div className="text-center py-8">
                      <Info className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Aucune tâche en attente pour le moment.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Le projet est à jour.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Tâches en retard */}
                      {tachesEnRetard.map((tache: any) => (
                        <div key={tache.id} className="flex items-start gap-3 py-3 border-b border-[#0000000d] hover:bg-[#f9fafb] transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#18181a]">
                              Tâche en retard : {tache.libelle}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Échéance {format(new Date(tache.dateFin), "dd/MM/yyyy")}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Risques critiques ouverts */}
                      {risquesCritiques.map((risque: any) => (
                        <div key={risque.id} className="flex items-start gap-3 py-3 border-b border-[#0000000d] hover:bg-[#f9fafb] transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#18181a]">
                              {risque.type === "INCIDENT" ? "Incident" : "Risque"} {risque.gravite.toLowerCase()} : {risque.titre}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Jalons en retard */}
                      {jalonsEnRetard.map((jalon: any) => (
                        <div key={jalon.id} className="flex items-start gap-3 py-3 border-b border-[#0000000d] hover:bg-[#f9fafb] transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#18181a]">
                              Jalon non validé : {jalon.libelle}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Prévu le {format(new Date(jalon.dateEcheance), "dd/MM/yyyy")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        );
      })()}

      {/* Onglets */}
      <div className="bg-white rounded-full p-[5px]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOngletActif("tableau-bord")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
              ongletActif === "tableau-bord"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-50"
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setOngletActif("avancement")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
              ongletActif === "avancement"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-50"
            }`}
          >
            Avancement
          </button>

          <button
            onClick={() => setOngletActif("equipes")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
              ongletActif === "equipes"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-50"
            }`}
          >
            Équipes
          </button>

          <button
            onClick={() => setOngletActif("budget")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
              ongletActif === "budget"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-50"
            }`}
          >
            Budget
          </button>

          <button
            onClick={() => setOngletActif("jalons")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
              ongletActif === "jalons"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-50"
            }`}
          >
            Jalons
          </button>

          <button
            onClick={() => setOngletActif("planning")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
              ongletActif === "planning"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-50"
            }`}
          >
            Planning
          </button>

          <button
            onClick={() => setOngletActif("notes")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
              ongletActif === "notes"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-50"
            }`}
          >
            Notes
          </button>

          <button
            onClick={() => setOngletActif("documents")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
              ongletActif === "documents"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-50"
            }`}
          >
            Documents
          </button>

          <button
            onClick={() => setOngletActif("risques")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
              ongletActif === "risques"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-50"
            }`}
          >
            Risques
          </button>

          <button
            onClick={() => setOngletActif("photos")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
              ongletActif === "photos"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-50"
            }`}
          >
            Photos
          </button>

          <button
            onClick={() => setOngletActif("ressources")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
              ongletActif === "ressources"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-50"
            }`}
          >
            Ressources
          </button>
        </div>
      </div>

      {/* Contenu de l'onglet Tableau de bord */}
      {ongletActif === "tableau-bord" && (
        <div className="space-y-6">
          {/* KPIs principaux */}
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Avancement global */}
              <CardIndicateur
                label="Avancement"
                helpText="Pourcentage d'avancement constaté du projet par rapport au planifié."
                value={`${avancementAffiche} %`}
                chart={
                  <MiniGraphProgression
                    percentage={avancementAffiche}
                  />
                }
              />

              {/* Tâches */}
              <CardIndicateur
                label="Tâches terminées"
                helpText="Nombre de tâches terminées sur le total des tâches du projet."
                value={`${projet.taches?.filter((t: any) => t.avancement === 100).length || 0}/${projet.taches?.length || 0}`}
                chart={
                  <MiniGraphCirculaire
                    percentage={
                      projet.taches?.length > 0
                        ? (projet.taches.filter((t: any) => t.avancement === 100).length / projet.taches.length) * 100
                        : 0
                    }
                  />
                }
              />

              {/* Jalons */}
              <CardIndicateur
                label="Jalons validés"
                helpText="Nombre de jalons validés sur le total des jalons du projet."
                value={`${projet.jalons?.filter((j: any) => j.valide).length || 0}/${projet.jalons?.length || 0}`}
                chart={
                  <MiniGraphCirculaire
                    percentage={
                      projet.jalons?.length > 0
                        ? (projet.jalons.filter((j: any) => j.valide).length / projet.jalons.length) * 100
                        : 0
                    }
                  />
                }
              />

              {/* Risques */}
              <CardIndicateur
                label="Risques ouverts"
                helpText="Nombre de risques actuellement ouverts ou en traitement, avec distinction des risques critiques/élevés."
                value={projet.risquesIncidents?.filter((r: any) =>
                  r.statut === "OUVERT" || r.statut === "EN_TRAITEMENT"
                ).length || 0}
                valueColor={
                  (projet.risquesIncidents?.filter((r: any) =>
                    (r.gravite === "CRITIQUE" || r.gravite === "ELEVEE") &&
                    (r.statut === "OUVERT" || r.statut === "EN_TRAITEMENT")
                  ).length || 0) > 0 ? "#ef4444" : "#18181a"
                }
                chart={
                  <MiniGraphBarres
                    values={[0, 1, 0, 2, 1, 0, projet.risquesIncidents?.filter((r: any) =>
                      r.statut === "OUVERT" || r.statut === "EN_TRAITEMENT"
                    ).length || 0]}
                  />
                }
              />
            </div>
          </TooltipProvider>

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
      {ongletActif === "avancement" && (() => {
        // Filtrage des tâches
        let tachesFiltrees = projet.taches || [];

        // Filtre par recherche
        if (rechercheTache) {
          tachesFiltrees = tachesFiltrees.filter((t: any) =>
            t.libelle.toLowerCase().includes(rechercheTache.toLowerCase())
          );
        }

        // Filtre par statut
        const maintenant = new Date();
        if (filtreTache === "en-cours") {
          tachesFiltrees = tachesFiltrees.filter((t: any) => t.avancement > 0 && t.avancement < 100);
        } else if (filtreTache === "terminees") {
          tachesFiltrees = tachesFiltrees.filter((t: any) => t.avancement === 100);
        } else if (filtreTache === "en-retard") {
          tachesFiltrees = tachesFiltrees.filter((t: any) =>
            t.dateFin && new Date(t.dateFin) < maintenant && t.avancement < 100
          );
        }

        // Calculs pour les compteurs de filtres
        const totalTaches = projet.taches?.length || 0;
        const tachesEnCours = projet.taches?.filter((t: any) => t.avancement > 0 && t.avancement < 100).length || 0;
        const tachesTerminees = projet.taches?.filter((t: any) => t.avancement === 100).length || 0;
        const tachesEnRetard = projet.taches?.filter((t: any) =>
          t.dateFin && new Date(t.dateFin) < maintenant && t.avancement < 100
        ).length || 0;

        // Pagination
        const total = tachesFiltrees.length;
        const totalPages = Math.ceil(total / limitTache);
        const debut = (pageTache - 1) * limitTache;
        const fin = debut + limitTache;
        const tachesPaginees = tachesFiltrees.slice(debut, fin);

        return (
          <div className="bg-white rounded-xl border border-[#0000001a] p-6">
            {/* Barre de recherche et filtres */}
            <div className="space-y-3">
              {/* Barre de recherche avec bouton */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher une tâche..."
                    value={rechercheTache}
                    onChange={(e) => {
                      setRechercheTache(e.target.value);
                      setPageTache(1);
                    }}
                    className="pl-10 pr-10 h-10"
                  />
                  {rechercheTache && (
                    <button
                      onClick={() => setRechercheTache("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Effacer la recherche"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
                <Button
                  onClick={ouvrirModalCreationTache}
                  className="gap-2 h-10 px-4 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground transition-all"
                >
                  <Plus className="size-4" />
                  Ajouter
                </Button>
              </div>

              {/* Filtres par statut */}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => { setFiltreTache("toutes"); setPageTache(1); }}>
                  <Badge
                    variant={filtreTache === "toutes" ? "default" : "outline"}
                    className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                  >
                    Toutes <span className="ml-1 opacity-70">({totalTaches})</span>
                  </Badge>
                </button>
                <button onClick={() => { setFiltreTache("en-cours"); setPageTache(1); }}>
                  <Badge
                    variant={filtreTache === "en-cours" ? "default" : "outline"}
                    className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                  >
                    En cours <span className="ml-1 opacity-70">({tachesEnCours})</span>
                  </Badge>
                </button>
                <button onClick={() => { setFiltreTache("terminees"); setPageTache(1); }}>
                  <Badge
                    variant={filtreTache === "terminees" ? "default" : "outline"}
                    className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                  >
                    Terminées <span className="ml-1 opacity-70">({tachesTerminees})</span>
                  </Badge>
                </button>
                <button onClick={() => { setFiltreTache("en-retard"); setPageTache(1); }}>
                  <Badge
                    variant={filtreTache === "en-retard" ? "default" : "outline"}
                    className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                  >
                    En retard <span className="ml-1 opacity-70">({tachesEnRetard})</span>
                  </Badge>
                </button>
              </div>
            </div>

            {/* Tableau */}
            <div className="mt-6 rounded-xl border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Tâche
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Début
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Fin
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Avancement
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Équipe
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tachesPaginees.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-12 text-center text-sm text-muted-foreground"
                        >
                          {rechercheTache
                            ? "Aucune tâche ne correspond à votre recherche."
                            : "Aucune tâche trouvée."}
                        </td>
                      </tr>
                    ) : (
                      tachesPaginees.map((tache: any) => (
                        <tr
                          key={tache.id}
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-sm text-foreground">{tache.libelle}</div>
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
                          <td className="py-3 px-4 text-sm text-foreground">
                            {tache.avancement ?? 0} %
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
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > 0 && (
                <div className="flex items-center justify-between px-4 py-4">
                  {/* Info et sélecteur de limite */}
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {debut + 1}-{Math.min(fin, total)}
                      </span>{" "}
                      sur{" "}
                      <span className="font-medium text-foreground">{total}</span>{" "}
                      tâches
                    </p>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Afficher :</span>
                      <Select
                        value={limitTache.toString()}
                        onValueChange={(value) => {
                          setLimitTache(parseInt(value));
                          setPageTache(1);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[80px] text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Navigation simplifiée */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPageTache(pageTache - 1)}
                        disabled={pageTache === 1}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-[#13850b] hover:text-[#0f6909] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="size-4" />
                        Précédent
                      </button>

                      <div className="flex items-center gap-1 px-3 py-1 bg-muted/30 rounded-md">
                        <span className="text-sm text-muted-foreground">Page</span>
                        <span className="text-sm font-bold text-[#13850b]">{pageTache}</span>
                        <span className="text-sm text-muted-foreground">sur</span>
                        <span className="text-sm font-medium text-foreground">{totalPages}</span>
                      </div>

                      <button
                        onClick={() => setPageTache(pageTache + 1)}
                        disabled={pageTache === totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-[#13850b] hover:text-[#0f6909] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Suivant
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Onglet Équipes */}
      {ongletActif === "equipes" && (() => {
        // Filtrage des affectations
        let affectationsFiltrees = projet.affectations || [];

        // Filtre par recherche
        if (rechercheAffectation) {
          affectationsFiltrees = affectationsFiltrees.filter((a: any) => {
            const nomComplet = `${a.employe.prenom} ${a.employe.nom}`.toLowerCase();
            return nomComplet.includes(rechercheAffectation.toLowerCase());
          });
        }

        // Filtre par statut
        if (filtreAffectation === "actifs") {
          affectationsFiltrees = affectationsFiltrees.filter((a: any) => !a.dateFin);
        } else if (filtreAffectation === "termines") {
          affectationsFiltrees = affectationsFiltrees.filter((a: any) => a.dateFin);
        }

        // Calculs pour les compteurs de filtres
        const totalAffectations = projet.affectations?.length || 0;
        const affectationsActives = projet.affectations?.filter((a: any) => !a.dateFin).length || 0;
        const affectationsTerminees = projet.affectations?.filter((a: any) => a.dateFin).length || 0;

        // Pagination
        const total = affectationsFiltrees.length;
        const totalPages = Math.ceil(total / limitAffectation);
        const debut = (pageAffectation - 1) * limitAffectation;
        const fin = debut + limitAffectation;
        const affectationsPaginees = affectationsFiltrees.slice(debut, fin);

        return (
          <div className="bg-white rounded-xl border border-[#0000001a] p-6">
            {/* Barre de recherche et filtres */}
            <div className="space-y-3">
              {/* Barre de recherche avec bouton */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher un employé..."
                    value={rechercheAffectation}
                    onChange={(e) => {
                      setRechercheAffectation(e.target.value);
                      setPageAffectation(1);
                    }}
                    className="pl-10 pr-10 h-10"
                  />
                  {rechercheAffectation && (
                    <button
                      onClick={() => setRechercheAffectation("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Effacer la recherche"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
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

              {/* Filtres par statut */}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => { setFiltreAffectation("tous"); setPageAffectation(1); }}>
                  <Badge
                    variant={filtreAffectation === "tous" ? "default" : "outline"}
                    className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                  >
                    Tous <span className="ml-1 opacity-70">({totalAffectations})</span>
                  </Badge>
                </button>
                <button onClick={() => { setFiltreAffectation("actifs"); setPageAffectation(1); }}>
                  <Badge
                    variant={filtreAffectation === "actifs" ? "default" : "outline"}
                    className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                  >
                    Actifs <span className="ml-1 opacity-70">({affectationsActives})</span>
                  </Badge>
                </button>
                <button onClick={() => { setFiltreAffectation("termines"); setPageAffectation(1); }}>
                  <Badge
                    variant={filtreAffectation === "termines" ? "default" : "outline"}
                    className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                  >
                    Terminés <span className="ml-1 opacity-70">({affectationsTerminees})</span>
                  </Badge>
                </button>
              </div>
            </div>

            {/* Tableau */}
            <div className="mt-6 rounded-xl border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Employé
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Rôle sur le chantier
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Depuis
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Jusqu'au
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {affectationsPaginees.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-sm text-muted-foreground"
                        >
                          {rechercheAffectation
                            ? "Aucun employé ne correspond à votre recherche."
                            : "Aucune affectation trouvée."}
                        </td>
                      </tr>
                    ) : (
                      affectationsPaginees.map((affectation: any) => (
                        <tr
                          key={affectation.id}
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-sm text-foreground">
                              {affectation.employe.prenom} {affectation.employe.nom}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground">
                            {affectation.roleFonctionnel}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {affectation.dateDebut
                              ? format(new Date(affectation.dateDebut), "dd/MM/yyyy")
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
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > 0 && (
                <div className="flex items-center justify-between px-4 py-4">
                  {/* Info et sélecteur de limite */}
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {debut + 1}-{Math.min(fin, total)}
                      </span>{" "}
                      sur{" "}
                      <span className="font-medium text-foreground">{total}</span>{" "}
                      affectations
                    </p>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Afficher :</span>
                      <Select
                        value={limitAffectation.toString()}
                        onValueChange={(value) => {
                          setLimitAffectation(parseInt(value));
                          setPageAffectation(1);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[80px] text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Navigation simplifiée */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPageAffectation(pageAffectation - 1)}
                        disabled={pageAffectation === 1}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-[#13850b] hover:text-[#0f6909] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="size-4" />
                        Précédent
                      </button>

                      <div className="flex items-center gap-1 px-3 py-1 bg-muted/30 rounded-md">
                        <span className="text-sm text-muted-foreground">Page</span>
                        <span className="text-sm font-bold text-[#13850b]">{pageAffectation}</span>
                        <span className="text-sm text-muted-foreground">sur</span>
                        <span className="text-sm font-medium text-foreground">{totalPages}</span>
                      </div>

                      <button
                        onClick={() => setPageAffectation(pageAffectation + 1)}
                        disabled={pageAffectation === totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-[#13850b] hover:text-[#0f6909] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Suivant
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

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
      {ongletActif === "notes" && (() => {
        // Filtrage des notes
        let notesFiltrees = projet.notes || [];

        // Filtre par recherche (titre + contenu)
        if (rechercheNote) {
          notesFiltrees = notesFiltrees.filter((n: any) => {
            const rechercheLower = rechercheNote.toLowerCase();
            const titre = (n.titre || "").toLowerCase();
            const contenu = (n.contenu || "").toLowerCase();
            return titre.includes(rechercheLower) || contenu.includes(rechercheLower);
          });
        }

        // Filtre par type
        if (filtreNote !== "toutes") {
          notesFiltrees = notesFiltrees.filter((n: any) => n.type.toLowerCase() === filtreNote);
        }

        // Calculs pour les compteurs de filtres
        const totalNotes = projet.notes?.length || 0;
        const countGenerale = projet.notes?.filter((n: any) => n.type === "GENERALE").length || 0;
        const countTechnique = projet.notes?.filter((n: any) => n.type === "TECHNIQUE").length || 0;
        const countQualite = projet.notes?.filter((n: any) => n.type === "QUALITE").length || 0;
        const countSecurite = projet.notes?.filter((n: any) => n.type === "SECURITE").length || 0;
        const countAdministrative = projet.notes?.filter((n: any) => n.type === "ADMINISTRATIVE").length || 0;
        const countReunion = projet.notes?.filter((n: any) => n.type === "REUNION").length || 0;

        // Pagination
        const total = notesFiltrees.length;
        const totalPages = Math.ceil(total / limitNote);
        const debut = (pageNote - 1) * limitNote;
        const fin = debut + limitNote;
        const notesPaginees = notesFiltrees.slice(debut, fin);

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

            {/* Barre de recherche et filtres */}
            <div className="bg-white rounded-xl border border-[#0000001a] p-4 space-y-4">
              {/* Barre de recherche avec X */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher dans les notes..."
                    value={rechercheNote}
                    onChange={(e) => {
                      setRechercheNote(e.target.value);
                      setPageNote(1);
                    }}
                    className="pl-10 pr-10 h-10"
                  />
                  {rechercheNote && (
                    <button
                      onClick={() => setRechercheNote("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Effacer la recherche"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtres par type */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Par type
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => { setFiltreNote("toutes"); setPageNote(1); }}>
                    <Badge
                      variant={filtreNote === "toutes" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Toutes <span className="ml-1 opacity-70">({totalNotes})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreNote("generale"); setPageNote(1); }}>
                    <Badge
                      variant={filtreNote === "generale" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Générale <span className="ml-1 opacity-70">({countGenerale})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreNote("technique"); setPageNote(1); }}>
                    <Badge
                      variant={filtreNote === "technique" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Technique <span className="ml-1 opacity-70">({countTechnique})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreNote("qualite"); setPageNote(1); }}>
                    <Badge
                      variant={filtreNote === "qualite" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Qualité <span className="ml-1 opacity-70">({countQualite})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreNote("securite"); setPageNote(1); }}>
                    <Badge
                      variant={filtreNote === "securite" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Sécurité <span className="ml-1 opacity-70">({countSecurite})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreNote("administrative"); setPageNote(1); }}>
                    <Badge
                      variant={filtreNote === "administrative" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Administrative <span className="ml-1 opacity-70">({countAdministrative})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreNote("reunion"); setPageNote(1); }}>
                    <Badge
                      variant={filtreNote === "reunion" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Réunion <span className="ml-1 opacity-70">({countReunion})</span>
                    </Badge>
                  </button>
                </div>
              </div>
            </div>

            {/* Liste des notes */}
            <Card>
              <CardContent className="p-4">
                {notesPaginees.length === 0 ? (
                  <div className="py-6 text-center">
                    <FileText className="size-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mb-1">
                      {rechercheNote || filtreNote !== "toutes"
                        ? "Aucune note ne correspond aux critères"
                        : "Aucune note enregistrée"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rechercheNote || filtreNote !== "toutes"
                        ? "Essayez de modifier les filtres de recherche"
                        : "Ajoutez des observations, comptes-rendus ou notes techniques"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notesPaginees.map((note: any) => (
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {total > 0 && (
              <div className="flex items-center justify-between bg-white rounded-xl border border-[#0000001a] p-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {debut + 1}–{Math.min(fin, total)} sur {total} note{total > 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Afficher</span>
                    <Select
                      value={limitNote.toString()}
                      onValueChange={(value) => {
                        setLimitNote(parseInt(value));
                        setPageNote(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageNote(pageNote - 1)}
                    disabled={pageNote <= 1}
                    className="h-8 gap-1 border-[#13850b] text-[#13850b] hover:bg-[#13850b]/10"
                  >
                    <ChevronLeft className="size-4" />
                    Précédent
                  </Button>
                  <div className="text-sm text-muted-foreground px-2">
                    Page {pageNote} sur {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageNote(pageNote + 1)}
                    disabled={pageNote >= totalPages}
                    className="h-8 gap-1 border-[#13850b] text-[#13850b] hover:bg-[#13850b]/10"
                  >
                    Suivant
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Onglet Documents */}
      {ongletActif === "documents" && (() => {
        // Filtrage des documents
        let documentsFiltres = projet.documents || [];

        // Filtre par recherche (nom fichier)
        if (rechercheDocument) {
          documentsFiltres = documentsFiltres.filter((d: any) => {
            const nomFichier = (d.nomFichier || "").toLowerCase();
            return nomFichier.includes(rechercheDocument.toLowerCase());
          });
        }

        // Filtre par catégorie
        if (filtreDocument !== "tous") {
          documentsFiltres = documentsFiltres.filter((d: any) => d.categorie.toLowerCase() === filtreDocument);
        }

        // Calculs pour les compteurs de filtres
        const totalDocuments = projet.documents?.length || 0;
        const countPlan = projet.documents?.filter((d: any) => d.categorie === "PLAN").length || 0;
        const countContrat = projet.documents?.filter((d: any) => d.categorie === "CONTRAT").length || 0;
        const countRapport = projet.documents?.filter((d: any) => d.categorie === "RAPPORT").length || 0;
        const countDevis = projet.documents?.filter((d: any) => d.categorie === "DEVIS").length || 0;
        const countAutorisation = projet.documents?.filter((d: any) => d.categorie === "AUTORISATION").length || 0;
        const countAutre = projet.documents?.filter((d: any) => d.categorie === "AUTRE").length || 0;

        // Pagination
        const total = documentsFiltres.length;
        const totalPages = Math.ceil(total / limitDocument);
        const debut = (pageDocument - 1) * limitDocument;
        const fin = debut + limitDocument;
        const documentsPagines = documentsFiltres.slice(debut, fin);

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

            {/* Barre de recherche et filtres */}
            <div className="bg-white rounded-xl border border-[#0000001a] p-4 space-y-4">
              {/* Barre de recherche avec X */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher par nom de fichier..."
                    value={rechercheDocument}
                    onChange={(e) => {
                      setRechercheDocument(e.target.value);
                      setPageDocument(1);
                    }}
                    className="pl-10 pr-10 h-10"
                  />
                  {rechercheDocument && (
                    <button
                      onClick={() => setRechercheDocument("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Effacer la recherche"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtres par catégorie */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Par catégorie
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => { setFiltreDocument("tous"); setPageDocument(1); }}>
                    <Badge
                      variant={filtreDocument === "tous" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Tous <span className="ml-1 opacity-70">({totalDocuments})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreDocument("plan"); setPageDocument(1); }}>
                    <Badge
                      variant={filtreDocument === "plan" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Plan <span className="ml-1 opacity-70">({countPlan})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreDocument("contrat"); setPageDocument(1); }}>
                    <Badge
                      variant={filtreDocument === "contrat" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Contrat <span className="ml-1 opacity-70">({countContrat})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreDocument("rapport"); setPageDocument(1); }}>
                    <Badge
                      variant={filtreDocument === "rapport" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Rapport <span className="ml-1 opacity-70">({countRapport})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreDocument("devis"); setPageDocument(1); }}>
                    <Badge
                      variant={filtreDocument === "devis" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Devis <span className="ml-1 opacity-70">({countDevis})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreDocument("autorisation"); setPageDocument(1); }}>
                    <Badge
                      variant={filtreDocument === "autorisation" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Autorisation <span className="ml-1 opacity-70">({countAutorisation})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreDocument("autre"); setPageDocument(1); }}>
                    <Badge
                      variant={filtreDocument === "autre" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Autre <span className="ml-1 opacity-70">({countAutre})</span>
                    </Badge>
                  </button>
                </div>
              </div>
            </div>

            {/* Liste des documents */}
            <Card>
              <CardContent className="p-4">
                {documentsPagines.length === 0 ? (
                  <div className="py-6 text-center">
                    <Paperclip className="size-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mb-1">
                      {rechercheDocument || filtreDocument !== "tous"
                        ? "Aucun document ne correspond aux critères"
                        : "Aucun document enregistré"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rechercheDocument || filtreDocument !== "tous"
                        ? "Essayez de modifier les filtres de recherche"
                        : "Ajoutez des plans, contrats, rapports ou autres documents liés au projet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documentsPagines.map((doc: any) => (
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {total > 0 && (
              <div className="flex items-center justify-between bg-white rounded-xl border border-[#0000001a] p-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {debut + 1}–{Math.min(fin, total)} sur {total} document{total > 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Afficher</span>
                    <Select
                      value={limitDocument.toString()}
                      onValueChange={(value) => {
                        setLimitDocument(parseInt(value));
                        setPageDocument(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageDocument(pageDocument - 1)}
                    disabled={pageDocument <= 1}
                    className="h-8 gap-1 border-[#13850b] text-[#13850b] hover:bg-[#13850b]/10"
                  >
                    <ChevronLeft className="size-4" />
                    Précédent
                  </Button>
                  <div className="text-sm text-muted-foreground px-2">
                    Page {pageDocument} sur {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageDocument(pageDocument + 1)}
                    disabled={pageDocument >= totalPages}
                    className="h-8 gap-1 border-[#13850b] text-[#13850b] hover:bg-[#13850b]/10"
                  >
                    Suivant
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Onglet Risques et Incidents */}
      {ongletActif === "risques" && (() => {
        // Filtrage des risques
        let risquesFiltres = projet.risquesIncidents || [];

        // Filtre par recherche (titre + description)
        if (rechercheRisque) {
          risquesFiltres = risquesFiltres.filter((r: any) => {
            const rechercheLower = rechercheRisque.toLowerCase();
            const titre = (r.titre || "").toLowerCase();
            const description = (r.description || "").toLowerCase();
            return titre.includes(rechercheLower) || description.includes(rechercheLower);
          });
        }

        // Filtre par type
        if (filtreRisque !== "tous") {
          risquesFiltres = risquesFiltres.filter((r: any) => r.type.toLowerCase() === filtreRisque);
        }

        // Filtre par gravité
        if (filtreGravite !== "toutes") {
          risquesFiltres = risquesFiltres.filter((r: any) => r.gravite.toLowerCase() === filtreGravite);
        }

        // Filtre par statut
        if (filtreStatut !== "tous") {
          risquesFiltres = risquesFiltres.filter((r: any) => r.statut.toLowerCase() === filtreStatut);
        }

        // Calculs pour les compteurs de filtres
        const totalRisques = projet.risquesIncidents?.length || 0;
        const countRisque = projet.risquesIncidents?.filter((r: any) => r.type === "RISQUE").length || 0;
        const countIncident = projet.risquesIncidents?.filter((r: any) => r.type === "INCIDENT").length || 0;
        const countFaible = projet.risquesIncidents?.filter((r: any) => r.gravite === "FAIBLE").length || 0;
        const countMoyenne = projet.risquesIncidents?.filter((r: any) => r.gravite === "MOYENNE").length || 0;
        const countElevee = projet.risquesIncidents?.filter((r: any) => r.gravite === "ELEVEE").length || 0;
        const countCritique = projet.risquesIncidents?.filter((r: any) => r.gravite === "CRITIQUE").length || 0;
        const countOuvert = projet.risquesIncidents?.filter((r: any) => r.statut === "OUVERT").length || 0;
        const countEnTraitement = projet.risquesIncidents?.filter((r: any) => r.statut === "EN_TRAITEMENT").length || 0;
        const countResolu = projet.risquesIncidents?.filter((r: any) => r.statut === "RESOLU").length || 0;
        const countCloture = projet.risquesIncidents?.filter((r: any) => r.statut === "CLOTURE").length || 0;

        // Pagination
        const total = risquesFiltres.length;
        const totalPages = Math.ceil(total / limitRisque);
        const debut = (pageRisque - 1) * limitRisque;
        const fin = debut + limitRisque;
        const risquesPagines = risquesFiltres.slice(debut, fin);

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

            {/* Barre de recherche et filtres */}
            <div className="bg-white rounded-xl border border-[#0000001a] p-4 space-y-4">
              {/* Barre de recherche avec X */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher par titre ou description..."
                    value={rechercheRisque}
                    onChange={(e) => {
                      setRechercheRisque(e.target.value);
                      setPageRisque(1);
                    }}
                    className="pl-10 pr-10 h-10"
                  />
                  {rechercheRisque && (
                    <button
                      onClick={() => setRechercheRisque("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Effacer la recherche"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtres par type */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Par type
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => { setFiltreRisque("tous"); setPageRisque(1); }}>
                    <Badge
                      variant={filtreRisque === "tous" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Tous <span className="ml-1 opacity-70">({totalRisques})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreRisque("risque"); setPageRisque(1); }}>
                    <Badge
                      variant={filtreRisque === "risque" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Risque <span className="ml-1 opacity-70">({countRisque})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreRisque("incident"); setPageRisque(1); }}>
                    <Badge
                      variant={filtreRisque === "incident" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Incident <span className="ml-1 opacity-70">({countIncident})</span>
                    </Badge>
                  </button>
                </div>
              </div>

              {/* Filtres par gravité */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Par gravité
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => { setFiltreGravite("toutes"); setPageRisque(1); }}>
                    <Badge
                      variant={filtreGravite === "toutes" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Toutes <span className="ml-1 opacity-70">({totalRisques})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreGravite("faible"); setPageRisque(1); }}>
                    <Badge
                      variant={filtreGravite === "faible" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Faible <span className="ml-1 opacity-70">({countFaible})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreGravite("moyenne"); setPageRisque(1); }}>
                    <Badge
                      variant={filtreGravite === "moyenne" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Moyenne <span className="ml-1 opacity-70">({countMoyenne})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreGravite("elevee"); setPageRisque(1); }}>
                    <Badge
                      variant={filtreGravite === "elevee" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Élevée <span className="ml-1 opacity-70">({countElevee})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreGravite("critique"); setPageRisque(1); }}>
                    <Badge
                      variant={filtreGravite === "critique" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Critique <span className="ml-1 opacity-70">({countCritique})</span>
                    </Badge>
                  </button>
                </div>
              </div>

              {/* Filtres par statut */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Par statut
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => { setFiltreStatut("tous"); setPageRisque(1); }}>
                    <Badge
                      variant={filtreStatut === "tous" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Tous <span className="ml-1 opacity-70">({totalRisques})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreStatut("ouvert"); setPageRisque(1); }}>
                    <Badge
                      variant={filtreStatut === "ouvert" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Ouvert <span className="ml-1 opacity-70">({countOuvert})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreStatut("en_traitement"); setPageRisque(1); }}>
                    <Badge
                      variant={filtreStatut === "en_traitement" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      En traitement <span className="ml-1 opacity-70">({countEnTraitement})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreStatut("resolu"); setPageRisque(1); }}>
                    <Badge
                      variant={filtreStatut === "resolu" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Résolu <span className="ml-1 opacity-70">({countResolu})</span>
                    </Badge>
                  </button>
                  <button onClick={() => { setFiltreStatut("cloture"); setPageRisque(1); }}>
                    <Badge
                      variant={filtreStatut === "cloture" ? "default" : "outline"}
                      className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
                    >
                      Clôturé <span className="ml-1 opacity-70">({countCloture})</span>
                    </Badge>
                  </button>
                </div>
              </div>
            </div>

            {/* Liste des risques */}
            <Card>
              <CardContent className="p-4">
                {risquesPagines.length === 0 ? (
                  <div className="py-6 text-center">
                    <AlertTriangle className="size-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mb-1">
                      {rechercheRisque || filtreRisque !== "tous" || filtreGravite !== "toutes" || filtreStatut !== "tous"
                        ? "Aucun risque ne correspond aux critères"
                        : "Aucun risque ou incident enregistré"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rechercheRisque || filtreRisque !== "tous" || filtreGravite !== "toutes" || filtreStatut !== "tous"
                        ? "Essayez de modifier les filtres de recherche"
                        : "Identifiez les risques potentiels et suivez les incidents survenus"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {risquesPagines.map((risque: any) => (
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {total > 0 && (
              <div className="flex items-center justify-between bg-white rounded-xl border border-[#0000001a] p-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {debut + 1}–{Math.min(fin, total)} sur {total} risque{total > 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Afficher</span>
                    <Select
                      value={limitRisque.toString()}
                      onValueChange={(value) => {
                        setLimitRisque(parseInt(value));
                        setPageRisque(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageRisque(pageRisque - 1)}
                    disabled={pageRisque <= 1}
                    className="h-8 gap-1 border-[#13850b] text-[#13850b] hover:bg-[#13850b]/10"
                  >
                    <ChevronLeft className="size-4" />
                    Précédent
                  </Button>
                  <div className="text-sm text-muted-foreground px-2">
                    Page {pageRisque} sur {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageRisque(pageRisque + 1)}
                    disabled={pageRisque >= totalPages}
                    className="h-8 gap-1 border-[#13850b] text-[#13850b] hover:bg-[#13850b]/10"
                  >
                    Suivant
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
