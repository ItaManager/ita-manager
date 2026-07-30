"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listerAbsencesCalendrier } from "@/lib/actions/conges";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

type AbsenceCalendrier = {
  id: string;
  employe: {
    matricule: string;
    nom: string;
    prenom: string;
  };
  typeAbsence: string;
  dateDebut: Date;
  dateFin: Date;
  nombreJours: number;
};

/**
 * Calendrier des absences validées
 * M3 Phase 5 - Vue mensuelle simplifiée
 *
 * TODO: Implémenter Patron 9 (vue calendrier complète)
 */
export function CalendrierAbsences() {
  const [moisCourant, setMoisCourant] = useState(new Date());
  const [absences, setAbsences] = useState<AbsenceCalendrier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerAbsences();
  }, [moisCourant]);

  async function chargerAbsences() {
    setLoading(true);
    try {
      const debut = startOfMonth(moisCourant);
      const fin = endOfMonth(moisCourant);

      const data = await listerAbsencesCalendrier({
        dateDebut: debut,
        dateFin: fin,
      });
      setAbsences(data);
    } catch (error) {
      console.error("Erreur chargement absences:", error);
    } finally {
      setLoading(false);
    }
  }

  function moisPrecedent() {
    setMoisCourant(subMonths(moisCourant, 1));
  }

  function moisSuivant() {
    setMoisCourant(addMonths(moisCourant, 1));
  }

  function aujourdhui() {
    setMoisCourant(new Date());
  }

  // Grouper les absences par date de début
  const absencesParDate = absences.reduce((acc, absence) => {
    const dateKey = format(new Date(absence.dateDebut), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(absence);
    return acc;
  }, {} as Record<string, AbsenceCalendrier[]>);

  const datesTriees = Object.keys(absencesParDate).sort();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="capitalize">
            {format(moisCourant, "MMMM yyyy", { locale: fr })}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={moisPrecedent}
              className="rounded-full"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={aujourdhui}
              className="rounded-full"
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={moisSuivant}
              className="rounded-full"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Chargement...
          </p>
        ) : absences.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune absence validée ce mois-ci
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {datesTriees.map((dateKey) => {
              const absencesJour = absencesParDate[dateKey];
              const date = new Date(dateKey);

              return (
                <div key={dateKey} className="space-y-2">
                  <div className="flex items-baseline gap-3 border-b pb-2">
                    <p className="text-2xl font-bold text-foreground">
                      {format(date, "dd")}
                    </p>
                    <p className="text-sm capitalize text-muted-foreground">
                      {format(date, "EEEE", { locale: fr })}
                    </p>
                  </div>

                  <div className="space-y-2 pl-4">
                    {absencesJour.map((absence) => (
                      <div
                        key={absence.id}
                        className="flex items-start gap-3 rounded-lg border p-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-medium">
                              {absence.employe.prenom} {absence.employe.nom}
                            </p>
                            <Badge variant="secondary">
                              {absence.employe.matricule}
                            </Badge>
                          </div>

                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {absence.typeAbsence}
                            </span>
                            <span>·</span>
                            <span>
                              {format(new Date(absence.dateDebut), "d MMM", {
                                locale: fr,
                              })}{" "}
                              au{" "}
                              {format(new Date(absence.dateFin), "d MMM", {
                                locale: fr,
                              })}
                            </span>
                            <span>·</span>
                            <span>
                              {absence.nombreJours} jour
                              {absence.nombreJours > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 rounded-md border border-info-border bg-info-soft p-4">
          <p className="text-xs text-muted-foreground">
            <strong>Note :</strong> Cette vue affiche les absences validées du
            mois. Une vue calendrier complète avec filtrage par service sera
            ajoutée ultérieurement (Patron 9).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
