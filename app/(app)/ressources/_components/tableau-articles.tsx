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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ArticleStock } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ArticleStockConverted = Omit<ArticleStock, "seuilAlerte"> & {
  seuilAlerte: number | null;
};

type TableauArticlesProps = {
  articles: ArticleStockConverted[];
  total: number;
  pages: number;
  pageActuelle: number;
};

export function TableauArticles({
  articles,
  total,
  pages,
  pageActuelle,
}: TableauArticlesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recherche, setRecherche] = useState(
    searchParams.get("recherche") || "",
  );

  const handleRecherche = (value: string) => {
    setRecherche(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("recherche", value);
    } else {
      params.delete("recherche");
    }
    params.delete("page");
    router.push(`/ressources/articles?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/ressources/articles?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Rechercher par référence, désignation, famille..."
          value={recherche}
          onChange={(e) => handleRecherche(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Désignation</TableHead>
              <TableHead>Famille</TableHead>
              <TableHead>Unité</TableHead>
              <TableHead className="text-right">Seuil alerte</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="text-muted-foreground">
                    Aucun article trouvé
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Créez votre premier article de stock pour commencer
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow
                  key={article.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/ressources/articles/${article.id}`)}
                >
                  <TableCell className="font-mono font-medium">
                    {article.reference}
                  </TableCell>
                  <TableCell>{article.designation}</TableCell>
                  <TableCell>
                    {article.famille ? (
                      <Badge variant="outline">{article.famille}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{article.unite}</TableCell>
                  <TableCell className="text-right">
                    {article.seuilAlerte ? (
                      article.seuilAlerte.toString()
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {article.actif ? (
                      <Badge variant="default">Actif</Badge>
                    ) : (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pageActuelle} sur {pages} — {total} article
            {total > 1 ? "s" : ""} au total
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
