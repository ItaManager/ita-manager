"use client";

import { useMemo } from "react";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface Tache {
  id: string;
  libelle: string;
  dateDebut: Date;
  dateFin: Date;
  avancementPlanifie: number;
  type: "tache" | "jalon";
  statut?: string;
}

interface GanttChartProps {
  taches: Tache[];
  onClickTache?: (tache: Tache) => void;
}

export function GanttChart({ taches, onClickTache }: GanttChartProps) {
  const {minDate, maxDate, totalDays} = useMemo(() => {
    if (taches.length === 0) {
      const now = new Date();
      return {
        minDate: startOfMonth(now),
        maxDate: endOfMonth(now),
        totalDays: 30,
      };
    }

    const dates = taches.flatMap((t) => [
      new Date(t.dateDebut),
      new Date(t.dateFin),
    ]);
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Ajouter une marge de 5% de chaque côté
    const totalSpan = differenceInDays(max, min);
    const margin = Math.max(Math.floor(totalSpan * 0.05), 3);

    return {
      minDate: addDays(min, -margin),
      maxDate: addDays(max, margin),
      totalDays: differenceInDays(addDays(max, margin), addDays(min, -margin)),
    };
  }, [taches]);

  const getBarPosition = (dateDebut: Date, dateFin: Date) => {
    const start = differenceInDays(new Date(dateDebut), minDate);
    const duration = differenceInDays(new Date(dateFin), new Date(dateDebut));

    const leftPercent = (start / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;

    return { left: `${leftPercent}%`, width: `${Math.max(widthPercent, 1)}%` };
  };

  // Position de la ligne "Aujourd'hui"
  const aujourdhuiPosition = useMemo(() => {
    const today = new Date();
    if (today < minDate || today > maxDate) return null;
    const daysSinceStart = differenceInDays(today, minDate);
    return (daysSinceStart / totalDays) * 100;
  }, [minDate, maxDate, totalDays]);

  // Générer les mois pour l'axe horizontal
  const mois = useMemo(() => {
    const result: Array<{ label: string; width: number }> = [];
    let currentDate = startOfMonth(minDate);
    const end = endOfMonth(maxDate);

    while (currentDate <= end) {
      const monthEnd = endOfMonth(currentDate);
      const visibleEnd = monthEnd > maxDate ? maxDate : monthEnd;
      const visibleStart = currentDate < minDate ? minDate : currentDate;

      const daysInView = differenceInDays(visibleEnd, visibleStart) + 1;
      const widthPercent = (daysInView / totalDays) * 100;

      result.push({
        label: format(currentDate, "MMM yyyy", { locale: fr }),
        width: widthPercent,
      });

      currentDate = addDays(monthEnd, 1);
    }

    return result;
  }, [minDate, maxDate, totalDays]);

  if (taches.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Aucune tâche ou jalon à afficher
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline header */}
      <div className="border-b border-border pb-2">
        <div className="flex">
          <div className="w-64 shrink-0"></div>
          <div className="flex-1 flex">
            {mois.map((m, i) => (
              <div
                key={i}
                style={{ width: `${m.width}%` }}
                className="text-xs font-medium text-muted-foreground text-center border-l border-border first:border-l-0 py-1"
              >
                {m.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt rows */}
      <div className="space-y-2">
        {taches.map((tache) => {
          const position = getBarPosition(tache.dateDebut, tache.dateFin);
          const isJalon = tache.type === "jalon";

          return (
            <div key={tache.id} className="flex items-center group">
              {/* Libellé */}
              <div className="w-64 shrink-0 pr-4">
                <div className="text-sm font-medium line-clamp-2">
                  {tache.libelle}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(tache.dateDebut), "dd MMM", { locale: fr })} -{" "}
                  {format(new Date(tache.dateFin), "dd MMM", { locale: fr })}
                </div>
              </div>

              {/* Timeline */}
              <div className="flex-1 relative h-10">
                {/* Grille verticale (mois) */}
                <div className="absolute inset-0 flex">
                  {mois.map((m, i) => (
                    <div
                      key={i}
                      style={{ width: `${m.width}%` }}
                      className="border-l border-border/30 first:border-l-0"
                    />
                  ))}
                </div>

                {/* Ligne "Aujourd'hui" */}
                {aujourdhuiPosition !== null && (
                  <div
                    className="absolute inset-y-0 w-0.5 bg-red-500 z-10"
                    style={{ left: `${aujourdhuiPosition}%` }}
                    title="Aujourd'hui"
                  />
                )}

                {/* Barre de tâche */}
                {isJalon ? (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
                    style={{ left: position.left }}
                  >
                    <div className="w-3 h-3 rotate-45 bg-primary" title={tache.libelle} />
                  </div>
                ) : (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-6 rounded transition-all group-hover:h-7 cursor-pointer"
                    style={{
                      ...position,
                      backgroundColor: tache.statut === "VALIDE" ? "#13850b" : "#1d186c",
                    }}
                    title={`${tache.libelle} (${tache.avancementPlanifie}%)`}
                    onClick={() => onClickTache?.(tache)}
                  >
                    {/* Barre de progression */}
                    {tache.avancementPlanifie > 0 && (
                      <div
                        className="h-full rounded bg-white/30"
                        style={{ width: `${tache.avancementPlanifie}%` }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex items-center gap-6 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-3 rounded" style={{ backgroundColor: "#1d186c" }} />
          <span className="text-xs text-muted-foreground">Tâche en attente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-3 rounded" style={{ backgroundColor: "#13850b" }} />
          <span className="text-xs text-muted-foreground">Tâche validée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rotate-45 bg-primary" />
          <span className="text-xs text-muted-foreground">Jalon</span>
        </div>
      </div>
    </div>
  );
}
