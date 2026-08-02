"use client";

import { Badge } from "@/components/ui/badge";
import { Flag, CheckCircle2, XCircle, Circle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { StatutJalon } from "@prisma/client";

interface Jalon {
  id: string;
  libelle: string;
  datePrevisionnelle: Date;
  statut: StatutJalon;
  valideLe?: Date | null;
}

interface TimelineJalonsProps {
  jalons: Jalon[];
}

export function TimelineJalons({ jalons }: TimelineJalonsProps) {
  // Trier les jalons par date prévisionnelle
  const jalonsTries = [...jalons].sort(
    (a, b) =>
      new Date(a.datePrevisionnelle).getTime() -
      new Date(b.datePrevisionnelle).getTime()
  );

  if (jalonsTries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Aucun jalon à afficher
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Ligne de temps */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

      {/* Jalons */}
      <div className="space-y-6">
        {jalonsTries.map((jalon, index) => {
          const isLast = index === jalonsTries.length - 1;
          const IconeStatut =
            jalon.statut === "VALIDE"
              ? CheckCircle2
              : jalon.statut === "ABANDONNE"
              ? XCircle
              : Circle;

          return (
            <div key={jalon.id} className="relative flex items-start gap-4">
              {/* Icône de statut */}
              <div
                className={`relative z-10 flex items-center justify-center size-16 rounded-full ${
                  jalon.statut === "VALIDE"
                    ? "bg-success-soft text-success"
                    : jalon.statut === "ABANDONNE"
                    ? "bg-destructive-soft text-destructive"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <IconeStatut className="size-8" aria-hidden="true" />
              </div>

              {/* Contenu du jalon */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{jalon.libelle}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Date prévisionnelle:{" "}
                      {format(new Date(jalon.datePrevisionnelle), "d MMMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                    {jalon.valideLe && (
                      <p className="text-sm text-success mt-1">
                        Validé le{" "}
                        {format(new Date(jalon.valideLe), "d MMMM yyyy", {
                          locale: fr,
                        })}
                      </p>
                    )}
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
