"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { History, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { listerHistoriqueVisites, purgerVisitesAnciennes } from "@/lib/actions/visiteurs";
import { toast } from "sonner";
import { format, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import type { Visite } from "@prisma/client";

type VisiteAvecEmploye = Visite & {
  visite: {
    nom: string;
    prenom: string;
  };
};

const MOTIFS_LABELS: Record<string, string> = {
  RENDEZ_VOUS: "Rendez-vous",
  LIVRAISON: "Livraison",
  ENTRETIEN: "Entretien",
  AUTRE: "Autre",
};

export default function HistoriqueVisitesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page") || "1");

  const [visites, setVisites] = useState<VisiteAvecEmploye[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    setChargement(true);
    const data = await listerHistoriqueVisites(page);
    setVisites(data.visites);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setChargement(false);
  }, [page]);

  useEffect(() => {
    charger();
  }, [charger]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handlePurge = async () => {
    if (
      !window.confirm(
        "Confirmer la purge des visites de plus de 3 mois ?\n\nCette action est irréversible."
      )
    ) {
      return;
    }

    try {
      const { count } = await purgerVisitesAnciennes();
      toast.success(`${count} visite${count !== 1 ? "s" : ""} supprimée${count !== 1 ? "s" : ""}`);
      charger();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la purge");
    }
  };

  const getDuree = (visite: VisiteAvecEmploye) => {
    if (!visite.sortieLe) return "—";
    const minutes = differenceInMinutes(
      new Date(visite.sortieLe),
      new Date(visite.arriveeLe)
    );
    const heures = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (heures === 0) return `${mins} min`;
    return `${heures}h${mins.toString().padStart(2, "0")}`;
  };

  if (chargement) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-3 mb-6">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Historique des visites</h1>
            <p className="text-sm text-muted-foreground">
              Toutes les visites enregistrées (3 derniers mois)
            </p>
          </div>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Historique des visites</h1>
            <p className="text-sm text-muted-foreground">
              {total} visite{total !== 1 ? "s" : ""} enregistrée
              {total !== 1 ? "s" : ""} · 3 derniers mois
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePurge}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Purger &gt; 3 mois
        </Button>
      </div>

      {visites.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucune visite dans l'historique.
        </div>
      ) : (
        <>
          <div className="border rounded-xl shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">DATE</TableHead>
                  <TableHead>VISITEUR</TableHead>
                  <TableHead>SOCIÉTÉ</TableHead>
                  <TableHead>PERSONNE VISITÉE</TableHead>
                  <TableHead>MOTIF</TableHead>
                  <TableHead className="w-[100px]">ARRIVÉE</TableHead>
                  <TableHead className="w-[100px]">SORTIE</TableHead>
                  <TableHead className="w-[100px] text-right">DURÉE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visites.map((visite) => (
                  <TableRow key={visite.id}>
                    <TableCell className="font-medium">
                      {format(new Date(visite.arriveeLe), "EEEE d MMM yyyy", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {visite.nomVisiteur}
                        {visite.pieceDeposee && (
                          <Badge variant="outline" className="text-xs">
                            Pièce
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {visite.societe || "—"}
                    </TableCell>
                    <TableCell>
                      {visite.visite.prenom} {visite.visite.nom}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {MOTIFS_LABELS[visite.motif]}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {format(new Date(visite.arriveeLe), "HH'h'mm", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {visite.sortieLe
                        ? format(new Date(visite.sortieLe), "HH'h'mm", {
                            locale: fr,
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {getDuree(visite)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Page {page} sur {totalPages} · {total} résultat
              {total !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
