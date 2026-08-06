"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, User, Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { StatutProjet } from "@prisma/client";
import type { ProjetListItem } from "@/lib/actions/projets";

const STATUT_CONFIG: Record<
  StatutProjet,
  { label: string; color: string; bg: string }
> = {
  BROUILLON: {
    label: "Brouillon",
    color: "#6B7280",
    bg: "#6B728020",
  },
  OUVERT: {
    label: "Ouvert",
    color: "#3B82F6",
    bg: "#3B82F620",
  },
  EN_COURS: {
    label: "En cours",
    color: "#13850b",
    bg: "#13850b20",
  },
  SUSPENDU: {
    label: "Suspendu",
    color: "#EF4444",
    bg: "#EF444420",
  },
  CLOTURE: {
    label: "Clôturé",
    color: "#9CA3AF",
    bg: "#9CA3AF20",
  },
};

interface CarteProjetProps {
  projet: ProjetListItem;
  onClick: () => void;
}

export function CarteProjet({ projet, onClick }: CarteProjetProps) {
  // Calculer les jours restants
  const joursRestants = projet.dateFin
    ? differenceInDays(new Date(projet.dateFin), new Date())
    : null;

  // Déterminer la couleur d'alerte pour les jours restants
  const getJoursRestantsColor = () => {
    if (joursRestants === null) return "text-muted-foreground";
    if (joursRestants < 0) return "text-destructive";
    if (joursRestants <= 7) return "text-orange-500";
    if (joursRestants <= 30) return "text-orange-400";
    return "text-muted-foreground";
  };

  // Calculer l'écart d'avancement
  const ecartAvancement =
    projet.avancementConstate !== null
      ? projet.avancementConstate - projet.avancementPlanifie
      : null;

  // Calculer le pourcentage du budget engagé
  const pourcentageBudget =
    projet.montantMarche && projet.montantEngage
      ? Math.round((projet.montantEngage / projet.montantMarche) * 100)
      : null;

  // Déterminer l'avancement affiché (constaté si disponible, sinon planifié)
  const avancementAffiche = projet.avancementConstate ?? projet.avancementPlanifie;

  const statutConfig = STATUT_CONFIG[projet.statut];

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      {/* En-tête : Code + Badges */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-muted-foreground">
            {projet.code}
          </span>
        </div>
        <div className="flex gap-2">
          <Badge
            variant="secondary"
            style={{
              backgroundColor: statutConfig.bg,
              color: statutConfig.color,
            }}
          >
            {statutConfig.label}
          </Badge>
          {/* TODO: Ajouter badge "avenant" si applicable */}
        </div>
      </div>

      {/* Titre du projet */}
      <h3 className="text-base font-semibold mb-3">{projet.nom}</h3>

      {/* Informations avec icônes */}
      <div className="space-y-1.5 mb-3">
        {/* Maître d'ouvrage */}
        {projet.maitreOuvrage && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="size-4" />
            <span>{projet.maitreOuvrage}</span>
          </div>
        )}

        {/* Localisation */}
        {projet.localisation && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            <span>{projet.localisation}</span>
          </div>
        )}

        {/* Conducteur */}
        {projet.conducteur && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="size-4" />
            <span>
              {projet.conducteur.prenom} {projet.conducteur.nom}
            </span>
          </div>
        )}
      </div>

      {/* Barre d'avancement */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Avancement</span>
          <span className="text-base font-semibold">{avancementAffiche} %</span>
        </div>

        {/* Barre de progression verte */}
        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden mb-0.5">
          <div
            className="h-full bg-green-600 rounded-full"
            style={{ width: `${avancementAffiche}%` }}
          />
        </div>

        {/* Ligne sous la barre : planifié à gauche, écart à droite */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            planifié {projet.avancementPlanifie} %
          </span>
          {ecartAvancement !== null && ecartAvancement !== 0 && (
            <span
              className={`text-xs font-medium ${
                ecartAvancement > 0 ? "text-green-600" : "text-orange-500"
              }`}
            >
              {ecartAvancement > 0 ? "+" : ""}
              {ecartAvancement} pts{" "}
              {ecartAvancement > 0 ? "d'avance" : "de retard"}
            </span>
          )}
          {ecartAvancement === 0 && (
            <span className="text-xs text-muted-foreground">conforme</span>
          )}
        </div>
      </div>

      {/* Dates et jours restants */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b">
        {projet.dateDebut && projet.dateFin ? (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              <span>
                {format(new Date(projet.dateDebut), "dd/MM/yyyy", { locale: fr })} →{" "}
                {format(new Date(projet.dateFin), "dd/MM/yyyy", {
                  locale: fr,
                })}
              </span>
            </div>
            {joursRestants !== null && (
              <span
                className={`text-sm font-medium ${
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
              </span>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Dates non définies</span>
        )}
      </div>

      {/* Informations financières */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Marché{" "}
          <span className="font-semibold text-foreground">
            {projet.montantMarche
              ? projet.montantMarche.toLocaleString("fr-FR").replace(/,/g, " ")
              : "-"}
          </span>
        </span>
        <span className="text-muted-foreground">
          Engagé{" "}
          <span className="font-semibold text-foreground">
            {projet.montantEngage
              ? projet.montantEngage.toLocaleString("fr-FR").replace(/,/g, " ")
              : "-"}
          </span>
        </span>
        <span className="text-muted-foreground text-xs">
          {pourcentageBudget !== null ? `(${pourcentageBudget} % du budget)` : ""}
        </span>
      </div>
    </Card>
  );
}
