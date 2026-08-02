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
import type { Inspection, LieuStockage, Materiel, MomentInspection, EtatPoint } from "@prisma/client";

type InspectionAvecRelations = Inspection & {
  materiel: Pick<Materiel, "codeIta" | "designation">;
  lieu: Pick<LieuStockage, "libelle">;
};

type TableauInspectionsProps = {
  inspections: InspectionAvecRelations[];
  total: number;
  pages: number;
  pageActuelle: number;
};

const MOMENT_LABELS: Record<MomentInspection, string> = {
  ENTREE: "Entrée",
  SORTIE: "Sortie",
};

const ETAT_LABELS: Record<EtatPoint, { label: string; variant: "default" | "destructive" | "secondary" }> = {
  BON: { label: "Bon", variant: "default" },
  MAUVAIS: { label: "Mauvais", variant: "destructive" },
  ABSENT: { label: "Absent", variant: "secondary" },
};

export function TableauInspections({
  inspections,
  total,
  pages,
  pageActuelle,
}: TableauInspectionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/ressources/inspections?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Matériel</TableHead>
              <TableHead>Moment</TableHead>
              <TableHead>Lieu</TableHead>
              <TableHead>État général</TableHead>
              <TableHead>Vérificateur</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inspections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="text-muted-foreground">
                    Aucune inspection trouvée
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Créez votre première inspection pour commencer
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              inspections.map((inspection) => {
                const etatConfig = ETAT_LABELS[inspection.etatGeneral];
                return (
                  <TableRow
                    key={inspection.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/ressources/inspections/${inspection.id}`)}
                  >
                    <TableCell>
                      {new Date(inspection.dateHeure).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                      <div className="text-xs text-muted-foreground">
                        {new Date(inspection.dateHeure).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">{inspection.materiel.codeIta}</div>
                      <div className="text-xs text-muted-foreground">
                        {inspection.materiel.designation}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{MOMENT_LABELS[inspection.moment]}</Badge>
                    </TableCell>
                    <TableCell>{inspection.lieu.libelle}</TableCell>
                    <TableCell>
                      <Badge variant={etatConfig.variant}>{etatConfig.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inspection.verificateurNom}
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
