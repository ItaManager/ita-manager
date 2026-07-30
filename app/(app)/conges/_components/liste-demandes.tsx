"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listerMesAbsences, type AbsenceListItem } from "@/lib/actions/conges";
import { ModalNouvelleDemande } from "./modal-nouvelle-demande";
import { StatutAbsence } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUT_LABELS: Record<StatutAbsence, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  BROUILLON: { label: "Brouillon", variant: "secondary" },
  ATTENTE_N1: { label: "En attente N+1", variant: "default" },
  ATTENTE_RH: { label: "En attente RH", variant: "default" },
  VALIDEE: { label: "Validée", variant: "outline" },
  REFUSEE: { label: "Refusée", variant: "destructive" },
  ANNULEE: { label: "Annulée", variant: "secondary" },
};

export function ListeDemandes() {
  const [absences, setAbsences] = useState<AbsenceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);

  useEffect(() => {
    chargerAbsences();
  }, []);

  async function chargerAbsences() {
    setLoading(true);
    try {
      const data = await listerMesAbsences();
      setAbsences(data);
    } catch (error) {
      console.error("Erreur chargement absences:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Mes demandes</CardTitle>
          <Button onClick={() => setModalOuverte(true)} className="rounded-full">
            <Plus className="size-4" />
            Nouvelle demande
          </Button>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chargement...
            </p>
          ) : absences.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune demande d'absence
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Cliquez sur "Nouvelle demande" pour créer votre première demande
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {absences.map((absence) => (
                <div
                  key={absence.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{absence.typeAbsence}</p>
                      <Badge variant={STATUT_LABELS[absence.statut].variant}>
                        {STATUT_LABELS[absence.statut].label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Du{" "}
                      {format(new Date(absence.dateDebut), "d MMMM yyyy", {
                        locale: fr,
                      })}{" "}
                      au{" "}
                      {format(new Date(absence.dateFin), "d MMMM yyyy", {
                        locale: fr,
                      })}{" "}
                      · {absence.nombreJours.toString()} jour
                      {Number(absence.nombreJours) > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {absence.soumieLe
                      ? `Soumise le ${format(new Date(absence.soumieLe), "d MMM", { locale: fr })}`
                      : `Créée le ${format(new Date(absence.creeLe), "d MMM", { locale: fr })}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ModalNouvelleDemande
        ouvert={modalOuverte}
        onOuvertChange={setModalOuverte}
        onSuccess={chargerAbsences}
      />
    </>
  );
}
