"use client";

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
import { useRouter, useSearchParams } from "next/navigation";
import type { TypeEntretien } from "@prisma/client";
import type { EntretienItem } from "@/lib/actions/entretien";

type TableauEntretiensProps = {
  entretiens: EntretienItem[];
  total: number;
  pages: number;
  pageActuelle: number;
};

const TYPE_LABELS: Record<TypeEntretien, { label: string; variant: "default" | "secondary" | "outline" }> = {
  PREVENTIF: { label: "Préventif", variant: "default" },
  CURATIF: { label: "Curatif", variant: "secondary" },
  REVISION: { label: "Révision", variant: "outline" },
};

const STATUT_LABELS: Record<"EN_COURS" | "TERMINE", { label: string; variant: "default" | "secondary" }> = {
  EN_COURS: { label: "En cours", variant: "secondary" },
  TERMINE: { label: "Terminé", variant: "default" },
};

export function TableauEntretiens({
  entretiens,
  total,
  pages,
  pageActuelle,
}: TableauEntretiensProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/ressources/entretien?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Matériel</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Technicien</TableHead>
              <TableHead className="text-right">Compteur</TableHead>
              <TableHead className="text-right">Coût</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entretiens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-muted-foreground">
                    Aucun entretien trouvé
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Planifiez votre premier entretien pour commencer
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              entretiens.map((entretien) => {
                const typeConfig = TYPE_LABELS[entretien.type];
                const statut = entretien.dateFin ? "TERMINE" : "EN_COURS";
                const statutConfig = STATUT_LABELS[statut];
                return (
                  <TableRow
                    key={entretien.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/ressources/entretien/${entretien.id}`)}
                  >
                    <TableCell>
                      {new Date(entretien.dateDebut).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                      {entretien.dateFin && (
                        <div className="text-xs text-muted-foreground">
                          au {new Date(entretien.dateFin).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">{entretien.materiel.codeIta}</div>
                      <div className="text-xs text-muted-foreground">
                        {entretien.materiel.designation}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entretien.technicien || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {entretien.compteur ? entretien.compteur.toLocaleString("fr-FR") : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {entretien.cout
                        ? `${entretien.cout.toLocaleString("fr-FR", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })} F`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statutConfig.variant}>{statutConfig.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pageActuelle === 1}
            onClick={() => handlePageChange(pageActuelle - 1)}
          >
            Précédent
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {pageActuelle} sur {pages}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={pageActuelle === pages}
            onClick={() => handlePageChange(pageActuelle + 1)}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
