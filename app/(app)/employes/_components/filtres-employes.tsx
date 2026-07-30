"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import type { TypeMainOeuvre } from "@prisma/client";

interface FiltresEmployesProps {
  typeMainOeuvreActif?: TypeMainOeuvre;
  statutDossierActif?: "COMPLET" | "INCOMPLET";
  rechercheActive?: string;
}

export function FiltresEmployes({
  typeMainOeuvreActif,
  statutDossierActif,
  rechercheActive,
}: FiltresEmployesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [recherche, setRecherche] = useState(rechercheActive ?? "");
  const [typeMainOeuvre, setTypeMainOeuvre] = useState<string | undefined>(
    typeMainOeuvreActif
  );
  const [statutDossier, setStatutDossier] = useState<string | undefined>(
    statutDossierActif
  );

  const appliquerFiltres = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (recherche) params.set("recherche", recherche);
    else params.delete("recherche");

    if (typeMainOeuvre) params.set("typeMainOeuvre", typeMainOeuvre);
    else params.delete("typeMainOeuvre");

    if (statutDossier) params.set("statutDossier", statutDossier);
    else params.delete("statutDossier");

    params.delete("page"); // Reset à page 1

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const reinitialiser = () => {
    setRecherche("");
    setTypeMainOeuvre(undefined);
    setStatutDossier(undefined);

    startTransition(() => {
      router.push("/employes");
    });
  };

  const aDesFiltres =
    recherche || typeMainOeuvre || statutDossier;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Rechercher par nom, prénom ou matricule..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && appliquerFiltres()}
              className="pl-9"
              aria-label="Rechercher un employé"
            />
          </div>

          {/* Bouton appliquer */}
          <Button onClick={appliquerFiltres} disabled={isPending}>
            {isPending ? "Filtrage..." : "Filtrer"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex gap-3 items-center">
          {/* Type main d'œuvre */}
          <Select value={typeMainOeuvre} onValueChange={setTypeMainOeuvre}>
            <SelectTrigger className="w-48" aria-label="Filtrer par type">
              <SelectValue placeholder="Type main d'œuvre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERMANENT">Permanent</SelectItem>
              <SelectItem value="JOURNALIER">Journalier</SelectItem>
            </SelectContent>
          </Select>

          {/* Statut dossier */}
          <Select value={statutDossier} onValueChange={setStatutDossier}>
            <SelectTrigger className="w-48" aria-label="Filtrer par statut dossier">
              <SelectValue placeholder="Statut du dossier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COMPLET">Dossier complet</SelectItem>
              <SelectItem value="INCOMPLET">Dossier incomplet</SelectItem>
            </SelectContent>
          </Select>

          {/* Bouton réinitialiser */}
          {aDesFiltres && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reinitialiser}
              disabled={isPending}
              aria-label="Réinitialiser les filtres"
            >
              <X className="size-4 mr-2" aria-hidden="true" />
              Réinitialiser
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
