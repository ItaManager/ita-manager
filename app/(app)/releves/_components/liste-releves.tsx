"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listerReleves, type ReleveListItem } from "@/lib/actions/releves";
import { StatutReleve } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Calendar, FileText, Users, AlertCircle } from "lucide-react";

const STATUT_LABELS: Record<
  StatutReleve,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  BROUILLON: { label: "Brouillon", variant: "secondary" },
  SOUMIS: { label: "Soumis", variant: "outline" },
  VISE: { label: "Visé", variant: "default" },
  REFUSE: { label: "Refusé", variant: "destructive" },
};

export function ListeReleves() {
  const [releves, setReleves] = useState<ReleveListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerReleves();
  }, []);

  async function chargerReleves() {
    setLoading(true);
    try {
      const data = await listerReleves();
      setReleves(data);
    } catch (error) {
      console.error("Erreur chargement relevés:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-sm text-muted-foreground">
            Chargement...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (releves.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Aucun relevé d'activité enregistré
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Les relevés quotidiens des chantiers apparaîtront ici
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {releves.map((releve) => {
        const statutInfo = STATUT_LABELS[releve.statut];

        return (
          <Link
            key={releve.id}
            href={`/releves/${releve.id}`}
            className="block transition-transform hover:scale-[1.01]"
          >
            <Card className="cursor-pointer hover:border-primary">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* En-tête */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <Calendar className="size-5 text-muted-foreground" />
                          <h3 className="font-semibold text-lg">
                            {format(new Date(releve.date), "EEEE d MMMM yyyy", {
                              locale: fr,
                            })}
                          </h3>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <p className="text-sm text-muted-foreground font-mono">
                            {releve.projet.code}
                          </p>
                          <span className="text-muted-foreground">•</span>
                          <p className="text-sm font-medium">{releve.projet.nom}</p>
                        </div>
                      </div>

                      <Badge variant={statutInfo.variant}>
                        {statutInfo.label}
                      </Badge>
                    </div>

                    {/* Détails */}
                    <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="size-4" />
                        <span>
                          Chef: {releve.chefChantier.nom} {releve.chefChantier.prenom}
                        </span>
                      </div>

                      {releve.nbPointages > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="size-4" />
                          <span>{releve.nbPointages} pointage(s)</span>
                        </div>
                      )}

                      {releve.nbTravaux > 0 && (
                        <div className="flex items-center gap-2">
                          <FileText className="size-4" />
                          <span>{releve.nbTravaux} travaux</span>
                        </div>
                      )}

                      {releve.nbIncidents > 0 && (
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertCircle className="size-4" />
                          <span>{releve.nbIncidents} incident(s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
