"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listerProjets, type ProjetListItem } from "@/lib/actions/projets";
import { StatutProjet } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Calendar, MapPin, DollarSign } from "lucide-react";

const STATUT_LABELS: Record<StatutProjet, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  BROUILLON: { label: "Brouillon", variant: "secondary" },
  OUVERT: { label: "Ouvert", variant: "default" },
  EN_COURS: { label: "En cours", variant: "outline" },
  SUSPENDU: { label: "Suspendu", variant: "destructive" },
  CLOTURE: { label: "Clôturé", variant: "secondary" },
};

export function ListeProjets() {
  const [projets, setProjets] = useState<ProjetListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerProjets();
  }, []);

  async function chargerProjets() {
    setLoading(true);
    try {
      const data = await listerProjets();
      setProjets(data);
    } catch (error) {
      console.error("Erreur chargement projets:", error);
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

  if (projets.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun projet créé
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cliquez sur "Nouveau projet" pour créer le premier projet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projets.map((projet) => (
        <Link
          key={projet.id}
          href={`/projets/${projet.id}`}
          className="transition-transform hover:scale-[1.02]"
        >
          <Card className="h-full cursor-pointer hover:border-primary">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {projet.code}
                  </p>
                  <CardTitle className="mt-1 text-base line-clamp-2">
                    {projet.nom}
                  </CardTitle>
                </div>
                <Badge variant={STATUT_LABELS[projet.statut].variant} className="shrink-0">
                  {STATUT_LABELS[projet.statut].label}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Maître d'ouvrage */}
              {projet.maitreOuvrage && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                  <span className="line-clamp-1 text-muted-foreground">
                    {projet.maitreOuvrage}
                  </span>
                </div>
              )}

              {/* Montant */}
              {projet.montantMarche && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="size-4 text-muted-foreground" />
                  <span className="font-medium">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "decimal",
                      minimumFractionDigits: 0,
                    }).format(projet.montantMarche)}{" "}
                    FCFA
                  </span>
                </div>
              )}

              {/* Dates */}
              {projet.dateDebut && projet.dateFin && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>
                    {format(new Date(projet.dateDebut), "MMM yyyy", { locale: fr })} →{" "}
                    {format(new Date(projet.dateFin), "MMM yyyy", { locale: fr })}
                  </span>
                </div>
              )}

              {/* Date de création si pas de dates */}
              {(!projet.dateDebut || !projet.dateFin) && (
                <div className="text-xs text-muted-foreground">
                  Créé le {format(new Date(projet.creeLe), "d MMMM yyyy", { locale: fr })}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
