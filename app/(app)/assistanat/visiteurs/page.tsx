"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCheck, Circle, CircleDot } from "lucide-react";
import {
  listerVisitesJour,
  enregistrerSortie,
  detecterVisitesNonCloses,
} from "@/lib/actions/visiteurs";
import { NouvelleVisiteModal } from "./_components/nouvelle-visite-modal";
import { formatDistanceToNow, differenceInHours, format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Visite, Employe } from "@prisma/client";

type VisiteAvecEmploye = Visite & {
  visite: {
    nom: string;
    prenom: string;
  };
};

export default function RegistreVisiteursPage() {
  const [visites, setVisites] = useState<VisiteAvecEmploye[]>([]);
  const [presentsCount, setPresentsCount] = useState(0);
  const [visitesNonCloses, setVisitesNonCloses] = useState<Set<string>>(
    new Set()
  );
  const [modalOuverte, setModalOuverte] = useState(false);
  const [chargement, setChargement] = useState(true);

  const chargerVisites = async () => {
    setChargement(true);
    const [{ visites: v, presentsCount: p }, { visitesNonCloses: vnc }] =
      await Promise.all([listerVisitesJour(), detecterVisitesNonCloses()]);

    setVisites(v);
    setPresentsCount(p);
    setVisitesNonCloses(new Set(vnc.map((v) => v.id)));
    setChargement(false);
  };

  useEffect(() => {
    chargerVisites();
  }, []);

  const handleSortie = async (visiteId: string) => {
    await enregistrerSortie(visiteId);
    await chargerVisites();
  };

  const handleNouvelleVisite = async () => {
    setModalOuverte(false);
    await chargerVisites();
  };

  const estNonClose = (visite: VisiteAvecEmploye) => {
    return visitesNonCloses.has(visite.id);
  };

  const getLabelTemps = (visite: VisiteAvecEmploye) => {
    if (visite.sortieLe) {
      return `${format(new Date(visite.arriveeLe), "HH'h'mm", { locale: fr })} — ${format(new Date(visite.sortieLe), "HH'h'mm", { locale: fr })}`;
    }

    const heures = differenceInHours(new Date(), new Date(visite.arriveeLe));
    if (heures >= 8) {
      return `arrivé ${format(new Date(visite.arriveeLe), "HH'h'mm", { locale: fr })}`;
    }

    return `arrivé ${formatDistanceToNow(new Date(visite.arriveeLe), { locale: fr, addSuffix: false })}`;
  };

  if (chargement) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-3 mb-6">
          <UserCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Visiteurs</h1>
            <p className="text-sm text-muted-foreground">
              Registre des visites du jour
            </p>
          </div>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <UserCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-semibold">Visiteurs</h1>
          <p className="text-sm text-muted-foreground">
            Registre des visites du jour
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <Button onClick={() => setModalOuverte(true)} size="default">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle visite
        </Button>

        <div className="text-lg font-medium">
          {presentsCount} présent{presentsCount !== 1 ? "s" : ""}
        </div>
      </div>

      {visites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune visite enregistrée aujourd'hui.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visites.map((visite) => {
            const nonClose = estNonClose(visite);
            const present = !visite.sortieLe;

            return (
              <Card
                key={visite.id}
                className={
                  nonClose
                    ? "border-warning border-2 bg-warning-soft/50"
                    : undefined
                }
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {present ? (
                        <CircleDot className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-lg">
                            {visite.nomVisiteur}
                          </span>
                          {visite.societe && (
                            <span className="text-muted-foreground">
                              {visite.societe}
                            </span>
                          )}
                          {visite.pieceDeposee && (
                            <Badge variant="outline" className="text-xs">
                              Pièce déposée
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>→ {visite.visite.prenom} {visite.visite.nom}</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <span className={present ? "font-medium" : ""}>
                            {getLabelTemps(visite)}
                          </span>
                          {nonClose && (
                            <Badge variant="outline" className="bg-warning-soft text-warning border-warning/20">
                              Non clos depuis {format(new Date(visite.arriveeLe), "HH'h'mm", { locale: fr })}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {present && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSortie(visite.id)}
                      >
                        Sortie
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NouvelleVisiteModal
        ouvert={modalOuverte}
        onClose={() => setModalOuverte(false)}
        onSuccess={handleNouvelleVisite}
      />
    </div>
  );
}
