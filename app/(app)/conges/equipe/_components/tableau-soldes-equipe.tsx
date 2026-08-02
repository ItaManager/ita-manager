"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Eye, Users, Calendar } from "lucide-react";
import Link from "next/link";

type Collaborateur = {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  posteActuel: string | null;
};

export function TableauSoldesEquipe() {
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    chargerCollaborateurs();
  }, []);

  async function chargerCollaborateurs() {
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
      // La liste des collaborateurs sera chargée quand les affectations seront en place
      setCollaborateurs([]);
    } catch (err: any) {
      console.error("Erreur chargement collaborateurs:", err);
      setError(err.message || "Erreur lors du chargement des données");
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

  // Placeholder Phase 2
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="mx-auto mb-4 size-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aucun collaborateur sous votre responsabilité
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            La liste de vos collaborateurs sera disponible après la mise en place
            des affectations (Module M2)
          </p>
        </CardContent>
      </Card>

      {/* Message informatif */}
      <Card className="border-warning-border bg-warning-soft">
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 size-5 text-warning" />
            <div>
              <p className="font-medium text-warning">
                Vue équipe non disponible (Phase 2)
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cette fonctionnalité nécessite le Module M2 (Employés et affectations)
                pour identifier vos collaborateurs directs. Une fois M2 déployé, vous
                verrez ici les soldes de congés de votre équipe.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
