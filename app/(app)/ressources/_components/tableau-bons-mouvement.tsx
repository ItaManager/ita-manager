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
import type { BonMouvement, LieuStockage, SensMouvement } from "@prisma/client";

type BonAvecRelations = BonMouvement & {
  lieuOrigine: Pick<LieuStockage, "libelle"> | null;
  lieuDestination: Pick<LieuStockage, "libelle"> | null;
  mouvements: { id: string }[];
};

type TableauBonsMouvementProps = {
  bons: BonAvecRelations[];
  total: number;
  pages: number;
  pageActuelle: number;
};

const SENS_LABELS: Record<SensMouvement, { label: string; variant: "default" | "secondary" | "outline" }> = {
  ENTREE: { label: "Entrée", variant: "default" },
  SORTIE: { label: "Sortie", variant: "secondary" },
  AJUSTEMENT: { label: "Ajustement", variant: "outline" },
};

export function TableauBonsMouvement({
  bons,
  total,
  pages,
  pageActuelle,
}: TableauBonsMouvementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/ressources/mouvements?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Sens</TableHead>
              <TableHead>Origine</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Motif</TableHead>
              <TableHead className="text-right">Lignes</TableHead>
              <TableHead>Émetteur</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-muted-foreground">
                    Aucun bon de mouvement trouvé
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Créez votre premier bon de mouvement pour commencer
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              bons.map((bon) => {
                const sensConfig = SENS_LABELS[bon.sens];
                return (
                  <TableRow
                    key={bon.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/ressources/mouvements/${bon.id}`)}
                  >
                    <TableCell className="font-mono">{bon.reference}</TableCell>
                    <TableCell>
                      {new Date(bon.dateMouvement).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sensConfig.variant}>{sensConfig.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {bon.lieuOrigine ? (
                        bon.lieuOrigine.libelle
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {bon.lieuDestination ? (
                        bon.lieuDestination.libelle
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{bon.motif}</TableCell>
                    <TableCell className="text-right">{bon.mouvements.length}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {bon.emetteurNom}
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
