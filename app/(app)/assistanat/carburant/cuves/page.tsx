"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Fuel, AlertTriangle, TrendingUp, ExternalLink } from "lucide-react";
import { listerCuves } from "@/lib/actions/carburant";
import { toast } from "sonner";
import Link from "next/link";

type Cuve = {
  id: string;
  libelle: string;
  articles: Array<{
    articleId: string;
    libelle: string;
    solde: number;
  }>;
};

export default function CuvesPage() {
  const [cuves, setCuves] = useState<Cuve[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    try {
      const data = await listerCuves();
      setCuves(data.cuves);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement");
    } finally {
      setChargement(false);
    }
  };

  // TODO: Récupérer les seuils d'alerte depuis ArticleStock
  const SEUIL_CRITIQUE = 200; // Litres
  const SEUIL_ATTENTION = 500; // Litres
  const CAPACITE_MAX = 2000; // Litres (exemple)

  const getStatutSolde = (solde: number) => {
    if (solde <= SEUIL_CRITIQUE) return "critique";
    if (solde <= SEUIL_ATTENTION) return "attention";
    return "normal";
  };

  const getProgressValue = (solde: number) => {
    return (solde / CAPACITE_MAX) * 100;
  };

  if (chargement) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-3 mb-6">
          <Fuel className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Cuves de carburant</h1>
            <p className="text-sm text-muted-foreground">
              Suivi des stocks de carburant en cuves
            </p>
          </div>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Chargement...
        </div>
      </div>
    );
  }

  const totalArticles = cuves.reduce((sum, c) => sum + c.articles.length, 0);
  const articlesCritiques = cuves.reduce(
    (sum, c) =>
      sum + c.articles.filter((a) => getStatutSolde(a.solde) === "critique").length,
    0
  );
  const articlesAttention = cuves.reduce(
    (sum, c) =>
      sum + c.articles.filter((a) => getStatutSolde(a.solde) === "attention").length,
    0
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Fuel className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Cuves de carburant</h1>
            <p className="text-sm text-muted-foreground">
              {cuves.length} cuve{cuves.length !== 1 ? "s" : ""} · {totalArticles}{" "}
              article{totalArticles !== 1 ? "s" : ""}
              {articlesCritiques > 0 && (
                <span className="text-destructive font-medium">
                  {" "}
                  · {articlesCritiques} critique{articlesCritiques !== 1 ? "s" : ""}
                </span>
              )}
              {articlesAttention > 0 && (
                <span className="text-orange-600 font-medium">
                  {" "}
                  · {articlesAttention} en attention
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ALERTES CRITIQUES */}
      {articlesCritiques > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-destructive mb-1">
                {articlesCritiques} article{articlesCritiques !== 1 ? "s" : ""} en seuil
                critique
              </div>
              <p className="text-sm text-muted-foreground">
                Réapprovisionnement urgent requis (≤ {SEUIL_CRITIQUE} L)
              </p>
            </div>
            <Link href="/logistique/stocks/mouvements">
              <Button variant="destructive" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Réapprovisionner
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {cuves.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucune cuve de carburant enregistrée.
        </div>
      ) : (
        <div className="space-y-6">
          {cuves.map((cuve) => (
            <div key={cuve.id} className="border rounded-xl shadow-sm">
              <div className="bg-muted/30 px-6 py-3 border-b">
                <h2 className="font-semibold">{cuve.libelle}</h2>
              </div>

              {cuve.articles.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Aucun article de carburant dans cette cuve
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ARTICLE</TableHead>
                      <TableHead className="w-[400px]">NIVEAU</TableHead>
                      <TableHead className="text-right w-[150px]">SOLDE</TableHead>
                      <TableHead className="w-[120px]">STATUT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuve.articles.map((article) => {
                      const statut = getStatutSolde(article.solde);
                      const progressValue = getProgressValue(article.solde);

                      return (
                        <TableRow key={article.articleId}>
                          <TableCell className="font-medium">
                            {article.libelle}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <Progress
                                  value={progressValue}
                                  className="h-2"
                                />
                              </div>
                              <div className="text-xs text-muted-foreground tabular-nums w-12 text-right">
                                {Math.round(progressValue)}%
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {article.solde.toFixed(0)} L
                          </TableCell>
                          <TableCell>
                            {statut === "critique" && (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Critique
                              </Badge>
                            )}
                            {statut === "attention" && (
                              <Badge variant="warning">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Attention
                              </Badge>
                            )}
                            {statut === "normal" && (
                              <Badge variant="success">Normal</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          ))}
        </div>
      )}

      {/* LÉGENDE */}
      <div className="mt-8 border rounded-lg p-4 bg-muted/20">
        <h3 className="text-sm font-semibold mb-3">Seuils d'alerte</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <Badge variant="destructive" className="mb-2">
              Critique
            </Badge>
            <p className="text-muted-foreground">≤ {SEUIL_CRITIQUE} L</p>
          </div>
          <div>
            <Badge variant="warning" className="mb-2">
              Attention
            </Badge>
            <p className="text-muted-foreground">
              {SEUIL_CRITIQUE + 1} - {SEUIL_ATTENTION} L
            </p>
          </div>
          <div>
            <Badge variant="success" className="mb-2">
              Normal
            </Badge>
            <p className="text-muted-foreground">&gt; {SEUIL_ATTENTION} L</p>
          </div>
        </div>
      </div>
    </div>
  );
}
