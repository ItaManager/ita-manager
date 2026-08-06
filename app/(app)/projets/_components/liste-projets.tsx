"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listerProjets, type ProjetListItem } from "@/lib/actions/projets";
import { Search } from "lucide-react";
import { CarteProjet } from "./carte-projet";
import { StatutProjet } from "@prisma/client";

const STATUT_LABELS: Record<StatutProjet, string> = {
  BROUILLON: "Brouillon",
  OUVERT: "Ouvert",
  EN_COURS: "En cours",
  SUSPENDU: "Suspendu",
  CLOTURE: "Clôturé",
};

export function ListeProjets() {
  const router = useRouter();
  const [projets, setProjets] = useState<ProjetListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<string>("");

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

  // Filtrer par recherche et statut
  const projetsFiltres = projets.filter((p) => {
    // Filtre de recherche
    const matchRecherche =
      !recherche ||
      p.code.toLowerCase().includes(recherche.toLowerCase()) ||
      p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      p.maitreOuvrage?.toLowerCase().includes(recherche.toLowerCase());

    // Filtre de statut
    const matchStatut = !filtreStatut || p.statut === filtreStatut;

    return matchRecherche && matchStatut;
  });

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
    <>
      {/* Barre de recherche et filtres */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-primary pointer-events-none" />
          <Input
            placeholder="Rechercher par code, nom ou maître d'ouvrage..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="pl-12 h-12 text-base border-2 border-border focus:border-primary transition-all shadow-sm focus:shadow-md"
          />
        </div>

        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="h-12 rounded-lg border-2 border-border bg-background px-4 text-base cursor-pointer min-w-[180px] transition-all hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm hover:shadow-md"
        >
          <option value="">Tous les statuts</option>
          <option value="BROUILLON">Brouillon</option>
          <option value="OUVERT">Ouvert</option>
          <option value="EN_COURS">En cours</option>
          <option value="SUSPENDU">Suspendu</option>
          <option value="CLOTURE">Clôturé</option>
        </select>
      </div>

      {/* Grille de cartes */}
      {projetsFiltres.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun projet trouvé
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projetsFiltres.map((projet) => (
            <CarteProjet
              key={projet.id}
              projet={projet}
              onClick={() => router.push(`/projets/${projet.id}`)}
            />
          ))}
        </div>
      )}
    </>
  );
}
