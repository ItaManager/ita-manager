"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Download, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Solde = {
  exercice: number;
  soldeTotal: number;
  anciennete: number;
  majorationAnciennete: number;
  mouvements: Array<{
    id: string;
    typeMouvement: string;
    jours: number;
    commentaire: string | null;
    enregistreLe: Date;
  }>;
};

export function AffichageSoldes() {
  const [solde, setSolde] = useState<Solde | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const anneeEnCours = new Date().getFullYear();
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(anneeEnCours);

  // Générer les années disponibles (année en cours + 2 années précédentes)
  const anneesDisponibles = [
    anneeEnCours,
    anneeEnCours - 1,
    anneeEnCours - 2,
  ];

  useEffect(() => {
    chargerSolde();
  }, [anneeSelectionnee]);

  async function chargerSolde() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Non authentifié");
        return;
      }

      // Pour cette Phase 2, on affiche un placeholder
      // Le calcul complet sera implémenté en Phase 6
      setSolde({
        exercice: anneeSelectionnee,
        soldeTotal: 0,
        anciennete: 0,
        majorationAnciennete: 0,
        mouvements: [],
      });
    } catch (err: any) {
      console.error("Erreur chargement solde:", err);
      setError(err.message || "Erreur lors du chargement des soldes");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!solde) {
    return null;
  }

  // Placeholder Phase 2 — Le calcul réel sera en Phase 6
  const dotationAcquise = 0;
  const consommation = 0;
  const report = 0;
  const soldeRestant = 0;
  const tauxUtilisation = 0;

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur d'année */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select
            value={anneeSelectionnee.toString()}
            onValueChange={(value) => setAnneeSelectionnee(Number(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anneesDisponibles.map((annee) => (
                <SelectItem key={annee} value={annee.toString()}>
                  {annee}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {solde.anciennete > 0 && (
            <Badge variant="outline" className="rounded-full">
              <TrendingUp className="mr-1 size-3" />
              {solde.anciennete} ans d'ancienneté
            </Badge>
          )}
        </div>

        <Button variant="outline" disabled className="rounded-full">
          <Download className="size-4" />
          Télécharger PDF
        </Button>
      </div>

      {/* Cartes de solde */}
      <div className="grid gap-4 md:grid-cols-2 lg:md:grid-cols-3">
        {/* Dotation acquise */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Acquis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">—</div>
            <p className="mt-1 text-xs text-muted-foreground">jours acquis</p>
            <p className="mt-2 text-xs text-warning">
              Calcul en attente (Phase 6)
            </p>
          </CardContent>
        </Card>

        {/* Consommation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pris
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">—</div>
            <p className="mt-1 text-xs text-muted-foreground">
              jours consommés
            </p>
            <p className="mt-2 text-xs text-warning">
              Calcul en attente (Phase 6)
            </p>
          </CardContent>
        </Card>

        {/* Report N-1 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Report N-1
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">—</div>
            <p className="mt-1 text-xs text-muted-foreground">
              jours reportés
            </p>
            <p className="mt-2 text-xs text-warning">
              Calcul en attente (Phase 6)
            </p>
          </CardContent>
        </Card>

        {/* Solde restant */}
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Restant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-primary">—</div>
            <p className="mt-1 text-xs text-muted-foreground">
              jours disponibles
            </p>
            <p className="mt-2 text-xs text-warning">
              Calcul en attente (Phase 6)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barre de progression */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Utilisation du solde</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Consommé : — jours
              </span>
              <span className="text-muted-foreground">
                Restant : — jours
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-muted" style={{ width: "0%" }} />
            </div>
            <p className="text-center text-xs text-warning">
              Le calcul des soldes sera disponible en Phase 6
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Message informatif */}
      <Card className="border-warning-border bg-warning-soft">
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 size-5 text-warning" />
            <div>
              <p className="font-medium text-warning">
                Calcul de solde non disponible (Phase 2)
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Le calcul automatique des soldes de congés (dotation, ancienneté,
                consommation) sera implémenté en Phase 6. Pour l'instant, vous pouvez
                créer et soumettre des demandes d'absence.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
