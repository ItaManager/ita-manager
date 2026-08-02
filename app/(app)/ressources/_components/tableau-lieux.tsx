"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LieuStockage, Projet } from "@prisma/client";

type LieuAvecProjet = LieuStockage & {
  projet: { code: string; nom: string } | null;
};

type TableauLieuxProps = {
  lieux: LieuAvecProjet[];
  total: number;
  pages: number;
  pageActuelle: number;
};

const NATURE_LABELS: Record<string, string> = {
  SITE: "Site",
  CHANTIER: "Chantier",
  GARAGE: "Garage",
  MAGASIN: "Magasin",
  BUREAU: "Bureau",
};

export function TableauLieux({
  lieux,
  total,
  pages,
  pageActuelle,
}: TableauLieuxProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/ressources/lieux?${params.toString()}`);
  };

  if (lieux.length === 0) {
    return (
      <div className="rounded-md border border-border p-8 text-center">
        <p className="text-muted-foreground">
          Aucun lieu de stockage enregistré.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Créez un premier lieu pour commencer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Libellé</TableHead>
              <TableHead>Nature</TableHead>
              <TableHead>Projet</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lieux.map((lieu) => (
              <TableRow
                key={lieu.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/ressources/lieux/${lieu.id}`)}
              >
                <TableCell className="font-medium">{lieu.libelle}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {NATURE_LABELS[lieu.nature] || lieu.nature}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lieu.projet ? (
                    <span className="text-sm">
                      {lieu.projet.code} — {lieu.projet.nom}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={lieu.actif ? "default" : "secondary"}>
                    {lieu.actif ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pageActuelle} sur {pages} — {total} lieu
            {total > 1 ? "x" : ""} au total
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pageActuelle - 1)}
              disabled={pageActuelle === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pageActuelle + 1)}
              disabled={pageActuelle === pages}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
