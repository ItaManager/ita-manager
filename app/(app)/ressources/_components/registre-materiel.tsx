import { listerMaterielM13 } from "@/lib/actions/logistique";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Lock, Wrench } from "lucide-react";
import Link from "next/link";
import { RechercheMateriel } from "./recherche-materiel";
import { PaginationMateriel } from "./pagination-materiel";

export async function RegistreMateriel({
  page,
  recherche,
}: {
  page: number;
  recherche: string;
}) {
  const resultat = await listerMaterielM13({ page, recherche });

  if (resultat.total === 0 && !recherche) {
    return (
      <div className="rounded-md border p-12 text-center">
        <Wrench className="size-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          Aucun matériel enregistré
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Le parc matériel sera visible ici
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RechercheMateriel recherche={recherche} />

      {resultat.total === 0 ? (
        <div className="rounded-md border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun résultat pour « {recherche} »
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Essayez une autre recherche (code ITA, ancien N° parc, code long)
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Code ITA</TableHead>
                  <TableHead>Désignation</TableHead>
                  <TableHead className="w-[140px]">Famille</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead className="w-[120px]">Statut</TableHead>
                  <TableHead className="w-[120px]">Lieu</TableHead>
                  <TableHead className="w-[120px] text-right">
                    Coût
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultat.items.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={`/ressources/${item.id}`}
                        className="hover:underline"
                      >
                        {item.codeIta}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.designation}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.famille.libelle}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {formatTypeMaterie(item.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatutVariant(item.statut)}>
                        {formatStatut(item.statut)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.lieuBase?.libelle || "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {item.coutAcquisition !== null ? (
                        `${item.coutAcquisition.toLocaleString("fr-FR")} F`
                      ) : (
                        <span className="flex items-center justify-end gap-1 text-muted-foreground">
                          <Lock className="size-3" aria-label="Accès restreint" />
                          Masqué
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationMateriel
            page={resultat.page}
            totalPages={resultat.totalPages}
            total={resultat.total}
            recherche={recherche}
          />
        </>
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
