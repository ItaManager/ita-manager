/**
 * Calcul de la météo du chantier
 * Indicateur visuel de la santé globale d'un projet
 */

export type MeteoChantier = "EXCELLENT" | "BON" | "ATTENTION" | "CRITIQUE";

export interface IndicateursMeteo {
  meteo: MeteoChantier;
  score: number;
  raisons: string[];
}

interface ProjetMeteoInput {
  avancementConstate: number | null;
  avancementPlanifie: number;
  dateDebut: Date | null;
  dateFin: Date | null;
  taches?: Array<{
    dateFin: Date | null;
    avancement: number;
  }>;
  jalons?: Array<{
    dateEcheance: Date | null;
    valide: boolean;
  }>;
  risquesIncidents?: Array<{
    type: string;
    gravite: string;
    statut: string;
  }>;
}

/**
 * Calcule la météo du chantier basée sur plusieurs indicateurs
 */
export function calculerMeteoChantier(projet: ProjetMeteoInput): IndicateursMeteo {
  const raisons: string[] = [];
  let score = 100; // Score de santé sur 100
  const maintenant = new Date();

  // 1. Écart d'avancement (poids: 35%)
  const avancementReel = projet.avancementConstate ?? 0;
  const avancementPlanifie = projet.avancementPlanifie ?? 0;
  const ecartAvancement = avancementReel - avancementPlanifie;

  if (ecartAvancement < -20) {
    score -= 35;
    raisons.push(`Retard significatif : ${Math.abs(ecartAvancement)}% sous le planifié`);
  } else if (ecartAvancement < -10) {
    score -= 20;
    raisons.push(`Léger retard : ${Math.abs(ecartAvancement)}% sous le planifié`);
  } else if (ecartAvancement < -5) {
    score -= 10;
    raisons.push(`Écart mineur d'avancement`);
  } else if (ecartAvancement > 5) {
    raisons.push(`Avance sur le planning : +${ecartAvancement}%`);
  }

  // 2. Respect des délais (poids: 25%)
  if (projet.dateFin && projet.dateFin < maintenant && avancementReel < 100) {
    const joursRetard = Math.floor(
      (maintenant.getTime() - projet.dateFin.getTime()) / (1000 * 60 * 60 * 24)
    );
    score -= 25;
    raisons.push(`Projet en dépassement : ${joursRetard} jour${joursRetard > 1 ? "s" : ""} au-delà de l'échéance`);
  } else if (projet.dateFin) {
    const joursRestants = Math.floor(
      (projet.dateFin.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (joursRestants > 0 && joursRestants < 7 && avancementReel < 90) {
      score -= 15;
      raisons.push(`Échéance proche : ${joursRestants} jour${joursRestants > 1 ? "s" : ""} restant${joursRestants > 1 ? "s" : ""}`);
    }
  }

  // 3. Tâches en retard (poids: 20%)
  const tachesEnRetard =
    projet.taches?.filter(
      (t) => t.dateFin && new Date(t.dateFin) < maintenant && t.avancement < 100
    ).length ?? 0;

  if (tachesEnRetard > 5) {
    score -= 20;
    raisons.push(`${tachesEnRetard} tâches en retard`);
  } else if (tachesEnRetard > 2) {
    score -= 12;
    raisons.push(`${tachesEnRetard} tâches en retard`);
  } else if (tachesEnRetard > 0) {
    score -= 5;
    raisons.push(`${tachesEnRetard} tâche${tachesEnRetard > 1 ? "s" : ""} en retard`);
  }

  // 4. Jalons non validés en retard (poids: 10%)
  const jalonsEnRetard =
    projet.jalons?.filter(
      (j) => !j.valide && j.dateEcheance && new Date(j.dateEcheance) < maintenant
    ).length ?? 0;

  if (jalonsEnRetard > 2) {
    score -= 10;
    raisons.push(`${jalonsEnRetard} jalons en retard`);
  } else if (jalonsEnRetard > 0) {
    score -= 5;
    raisons.push(`${jalonsEnRetard} jalon${jalonsEnRetard > 1 ? "s" : ""} non validé${jalonsEnRetard > 1 ? "s" : ""}`);
  }

  // 5. Risques et incidents critiques (poids: 10%)
  const risquesCritiques =
    projet.risquesIncidents?.filter(
      (r) =>
        (r.gravite === "CRITIQUE" || r.gravite === "ELEVEE") &&
        (r.statut === "OUVERT" || r.statut === "EN_TRAITEMENT")
    ).length ?? 0;

  if (risquesCritiques > 3) {
    score -= 10;
    raisons.push(`${risquesCritiques} risques critiques ou élevés ouverts`);
  } else if (risquesCritiques > 1) {
    score -= 5;
    raisons.push(`${risquesCritiques} risques critiques ou élevés ouverts`);
  } else if (risquesCritiques === 1) {
    score -= 3;
    raisons.push(`1 risque critique ou élevé ouvert`);
  }

  // Déterminer la météo finale
  let meteo: MeteoChantier;
  if (score >= 85) {
    meteo = "EXCELLENT";
    if (raisons.length === 0) {
      raisons.push("Projet en excellente santé");
    }
  } else if (score >= 70) {
    meteo = "BON";
    if (raisons.length === 0) {
      raisons.push("Projet sur les rails");
    }
  } else if (score >= 50) {
    meteo = "ATTENTION";
  } else {
    meteo = "CRITIQUE";
  }

  return {
    meteo,
    score: Math.max(0, Math.min(100, score)),
    raisons,
  };
}

/**
 * Configuration visuelle de la météo
 */
export const METEO_CONFIG: Record<
  MeteoChantier,
  {
    label: string;
    couleur: string;
    bg: string;
    icon: string;
  }
> = {
  EXCELLENT: {
    label: "Excellent",
    couleur: "#10B981",
    bg: "#10B98120",
    icon: "☀️",
  },
  BON: {
    label: "Bon",
    couleur: "#13850b",
    bg: "#13850b20",
    icon: "🌤️",
  },
  ATTENTION: {
    label: "Attention",
    couleur: "#F59E0B",
    bg: "#F59E0B20",
    icon: "⛅",
  },
  CRITIQUE: {
    label: "Critique",
    couleur: "#EF4444",
    bg: "#EF444420",
    icon: "⛈️",
  },
};
