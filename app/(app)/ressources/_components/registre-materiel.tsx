import { listerMaterielM13 } from "@/lib/actions/logistique";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Wrench, Eye } from "lucide-react";
import Link from "next/link";
import { BarreRechercheMateriel } from "./barre-recherche-materiel";
import { PaginationMateriel } from "./pagination-materiel";
import { prisma } from "@/lib/db/prisma";

interface RegistreMaterielProps {
  recherche?: string;
  filtre?: "disponibles" | "en-service" | "en-maintenance" | "hors-service" | "vehicules" | "engins" | "materiel" | "outillage" | "tous";
  page?: number;
  limit?: number;
  familles: Array<{ id: string; code: string; libelle: string; type: string }>;
  lieux: Array<{ id: string; libelle: string }>;
}

export async function RegistreMateriel({
  recherche,
  filtre = "tous",
  page = 1,
  limit = 20,
  familles,
  lieux,
}: RegistreMaterielProps) {
  const resultat = await listerMaterielM13({ page, recherche, filtre, limit });

  // Compter pour les filtres (tous les matériels sans filtre)
  const tousMateriels = await prisma.materiel.findMany({
    select: { statut: true, type: true },
  });

  const counts = {
    disponibles: tousMateriels.filter((m) => m.statut === "DISPONIBLE").length,
    enService: tousMateriels.filter((m) => ["EN_MISSION", "AFFECTE"].includes(m.statut)).length,
    enMaintenance: tousMateriels.filter((m) => m.statut === "EN_MAINTENANCE").length,
    horsService: tousMateriels.filter((m) => ["HORS_SERVICE", "EN_PANNE", "REFORME"].includes(m.statut)).length,
    vehicules: tousMateriels.filter((m) => ["VEHICULE_LEGER", "VEHICULE_LOURD"].includes(m.type)).length,
    engins: tousMateriels.filter((m) => m.type === "ENGIN").length,
    materiel: tousMateriels.filter((m) => m.type === "PETIT_MATERIEL").length,
    outillage: tousMateriels.filter((m) => ["OUTILLAGE", "MOBILIER", "CONTENEUR"].includes(m.type)).length,
    tous: tousMateriels.length,
  };

  // Filtrer résultats par recherche côté serveur (déjà fait dans listerMaterielM13)
  let resultats = resultat.items;
  const total = resultat.total;

  return (
    <div className="bg-white rounded-xl border border-[#0000001a] p-6">
      {/* Recherche et filtres */}
      <BarreRechercheMateriel counts={counts} familles={familles} lieux={lieux} />

      {/* Tableau */}
      <div className="mt-6 rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Code ITA
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Désignation
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Famille
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Statut
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Immatriculation
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {resultats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Wrench className="size-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {recherche ? `Aucun résultat pour « ${recherche} »` : "Aucun matériel"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {recherche
                        ? "Essayez une autre recherche"
                        : "Le parc matériel sera visible ici"}
                    </p>
                  </td>
                </tr>
              ) : (
                resultats.map((materiel) => (
                  <tr key={materiel.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/ressources/${materiel.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {materiel.codeIta}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-sm">{materiel.designation}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">
                        {formatTypeMaterie(materiel.type)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {materiel.famille.libelle}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatutVariant(materiel.statut)} className="text-xs">
                        {formatStatut(materiel.statut)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono">
                      {materiel.immatriculation || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/ressources/${materiel.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Eye className="size-4 mr-1" />
                          Voir
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-4">
          <PaginationMateriel
            page={resultat.page}
            totalPages={resultat.totalPages}
            total={resultat.total}
          />
        </div>
      )}
    </div>
  );
}

function formatTypeMaterie(type: string): string {
  const types: Record<string, string> = {
    VEHICULE_LEGER: "Véhicule léger",
    VEHICULE_LOURD: "Véhicule lourd",
    ENGIN: "Engin",
    PETIT_MATERIEL: "Petit matériel",
    CONTENEUR: "Conteneur",
    MOBILIER: "Mobilier",
  };
  return types[type] || type;
}

function formatStatut(statut: string): string {
  const statuts: Record<string, string> = {
    DISPONIBLE: "Disponible",
    EN_MISSION: "En mission",
    DEMOBILISE: "Démobilisé",
    EN_PANNE: "En panne",
    EN_MAINTENANCE: "Maintenance",
    HORS_SERVICE: "Hors service",
    REFORME: "Réformé",
  };
  return statuts[statut] || statut;
}

function getStatutVariant(
  statut: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (statut) {
    case "DISPONIBLE":
      return "default";
    case "EN_MISSION":
      return "outline";
    case "EN_PANNE":
    case "HORS_SERVICE":
      return "destructive";
    case "EN_MAINTENANCE":
      return "outline";
    case "DEMOBILISE":
    case "REFORME":
      return "secondary";
    default:
      return "secondary";
  }
}
