"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listerPeriodesPaie, type PeriodePaieListItem } from "@/lib/actions/paie";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Calendar, CheckCircle, Clock, XCircle, FileText } from "lucide-react";

const STATUT_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  OUVERTE: { label: "Ouverte", variant: "outline", icon: <Clock className="size-3 mr-1" /> },
  VALIDEE_RH: { label: "Validée RH", variant: "secondary", icon: <CheckCircle className="size-3 mr-1" /> },
  VALIDEE_DT: { label: "Validée DT", variant: "secondary", icon: <CheckCircle className="size-3 mr-1" /> },
  VALIDEE_DFC: { label: "Validée DFC", variant: "default", icon: <CheckCircle className="size-3 mr-1" /> },
  CLOTUREE: { label: "Clôturée", variant: "default", icon: <CheckCircle className="size-3 mr-1" /> },
  REFUSEE: { label: "Refusée", variant: "destructive", icon: <XCircle className="size-3 mr-1" /> },
};

export function ListePeriodesPaie() {
  const [periodes, setPeriodes] = useState<PeriodePaieListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerPeriodes();
  }, []);

  async function chargerPeriodes() {
    setLoading(true);
    try {
      const data = await listerPeriodesPaie();
      setPeriodes(data);
    } catch (error) {
      console.error("Erreur chargement périodes:", error);
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

  if (periodes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Aucune période de paie enregistrée
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Les périodes de paie par projet apparaîtront ici
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {periodes.map((periode) => {
        const statutInfo = STATUT_LABELS[periode.statut] || {
          label: periode.statut,
          variant: "secondary" as const,
          icon: null,
        };

        return (
          <Link
            key={periode.id}
            href={`/planning/${periode.id}`}
            className="block transition-transform hover:scale-[1.01]"
          >
            <Card className="cursor-pointer hover:border-primary">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <Calendar className="size-5 text-muted-foreground" />
                          <h3 className="font-semibold text-lg">
                            {format(new Date(periode.dateDebut), "d MMM", { locale: fr })} →{" "}
                            {format(new Date(periode.dateFin), "d MMM yyyy", { locale: fr })}
                          </h3>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <p className="text-sm text-muted-foreground font-mono">
                            {periode.projet.code}
                          </p>
                          <span className="text-muted-foreground">•</span>
                          <p className="text-sm font-medium">{periode.projet.nom}</p>
                        </div>
                      </div>

                      <Badge variant={statutInfo.variant}>
                        {statutInfo.icon}
                        {statutInfo.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                      {periode.nbLignes > 0 && (
                        <div className="flex items-center gap-2">
                          <FileText className="size-4" />
                          <span>{periode.nbLignes} ligne(s) de paie</span>
                        </div>
                      )}

                      {periode.nbLignes === 0 && (
                        <span className="text-warning">Aucune ligne de paie</span>
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
