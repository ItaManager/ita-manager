"use client";

import { useMemo } from "react";
import { calculerMeteoChantier, METEO_CONFIG } from "@/lib/projets/meteo";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MeteoChantierProps {
  projet: {
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
  };
  variant?: "badge" | "card";
  showDetails?: boolean;
}

export function MeteoChantier({
  projet,
  variant = "badge",
  showDetails = false,
}: MeteoChantierProps) {
  const indicateurs = useMemo(() => {
    return calculerMeteoChantier({
      avancementConstate: projet.avancementConstate,
      avancementPlanifie: projet.avancementPlanifie,
      dateDebut: projet.dateDebut ? new Date(projet.dateDebut) : null,
      dateFin: projet.dateFin ? new Date(projet.dateFin) : null,
      taches: projet.taches,
      jalons: projet.jalons,
      risquesIncidents: projet.risquesIncidents,
    });
  }, [projet]);

  const config = METEO_CONFIG[indicateurs.meteo];

  if (variant === "card") {
    return (
      <div
        className="rounded-lg border p-4"
        style={{
          backgroundColor: config.bg,
          borderColor: `${config.couleur}40`,
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl" aria-hidden="true">
            {config.icon}
          </span>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Météo du chantier</p>
            <p
              className="text-xl font-semibold"
              style={{ color: config.couleur }}
            >
              {config.label}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: config.couleur }}
            >
              {indicateurs.score}
            </p>
            <p className="text-xs text-muted-foreground">/100</p>
          </div>
        </div>
        {showDetails && indicateurs.raisons.length > 0 && (
          <div className="space-y-1">
            {indicateurs.raisons.map((raison, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground">•</span>
                <span>{raison}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Badge variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className="gap-1.5 cursor-help"
            style={{
              backgroundColor: config.bg,
              color: config.couleur,
              border: `1px solid ${config.couleur}40`,
            }}
          >
            <span aria-hidden="true">{config.icon}</span>
            {config.label}
            {showDetails && (
              <Info className="size-3 ml-0.5" aria-label="Détails" />
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm" side="bottom" align="start">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold">Score de santé</span>
              <span
                className="text-lg font-bold tabular-nums"
                style={{ color: config.couleur }}
              >
                {indicateurs.score}/100
              </span>
            </div>
            {indicateurs.raisons.length > 0 && (
              <>
                <hr className="border-border" />
                <div className="space-y-1">
                  {indicateurs.raisons.map((raison, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground">•</span>
                      <span>{raison}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
