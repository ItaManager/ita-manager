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
import type { Reception, IssueReception } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

type ReceptionAvecLignes = Reception & {
  lignes: { articleStockId: string; quantiteLivree: Decimal }[];
};

type TableauReceptionsProps = {
  receptions: ReceptionAvecLignes[];
  total: number;
  pages: number;
  pageActuelle: number;
};

const ISSUE_LABELS: Record<IssueReception, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  CONFORME: { label: "Conforme", variant: "default" },
  AVEC_RESERVE: { label: "Avec réserve", variant: "secondary" },
  NON_CONFORME: { label: "Non conforme", variant: "destructive" },
};

export function TableauReceptions({
  receptions,
  total,
  pages,
  pageActuelle,
}: TableauReceptionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/ressources/receptions?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead className="text-right">Lignes</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Réceptionné par</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-muted-foreground">
                    Aucune réception trouvée
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Créez votre première réception pour commencer
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              receptions.map((reception) => {
                const issueConfig = reception.issue ? ISSUE_LABELS[reception.issue] : null;
                return (
                  <TableRow
                    key={reception.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/ressources/receptions/${reception.id}`)}
                  >
                    <TableCell className="font-mono">{reception.reference}</TableCell>
                    <TableCell>
                      {new Date(reception.dateReception).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{reception.fournisseurNom}</TableCell>
                    <TableCell className="text-right">{reception.lignes.length}</TableCell>
                    <TableCell>
                      {issueConfig ? (
                        <Badge variant={issueConfig.variant}>{issueConfig.label}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {reception.receptionneParNom}
                    </TableCell>
                    <TableCell>
                      {reception.valideParId ? (
                        <Badge variant="default">Validée</Badge>
                      ) : (
                        <Badge variant="secondary">En attente</Badge>
                      )}
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
