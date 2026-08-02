"use client";

import { useEffect, useState } from "react";
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
import { FileCheck, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import {
  listerCourrierATraiter,
  marquerTraite,
  marquerSansSuite,
} from "@/lib/actions/courrier";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import type { Courrier, StatutTraitement } from "@prisma/client";
import { toast } from "sonner";

type CourrierAvecRelations = Courrier & {
  service: { libelle: string } | null;
  direction: { libelle: string } | null;
  traitePar: { email: string } | null;
};

const STATUT_LABELS: Record<StatutTraitement, string> = {
  A_TRAITER: "À traiter",
  TRAITE: "Traité",
  SANS_SUITE: "Sans suite",
};

const STATUT_VARIANTS: Record<
  StatutTraitement,
  "default" | "secondary" | "outline"
> = {
  A_TRAITER: "default",
  TRAITE: "secondary",
  SANS_SUITE: "outline",
};

export default function CourrierATraiterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page") || "1");

  const [courriers, setCourriers] = useState<CourrierAvecRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [aTraiterCount, setATraiterCount] = useState(0);
  const [chargement, setChargement] = useState(true);

  const charger = async () => {
    setChargement(true);
    const data = await listerCourrierATraiter(page);
    setCourriers(data.courriers);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setATraiterCount(data.aTraiterCount);
    setChargement(false);
  };

  useEffect(() => {
    charger();
  }, [page]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleMarquerTraite = async (courrierId: string) => {
    try {
      await marquerTraite({ courrierId });
      toast.success("Courrier marqué traité");
      await charger();
    } catch (error: any) {
      toast.error(error.message || "Erreur");
    }
  };

  const handleMarquerSansSuite = async (courrierId: string) => {
    const commentaire = window.prompt("Motif (obligatoire):");
    if (!commentaire?.trim()) {
      toast.error("Le motif est obligatoire");
      return;
    }

    try {
      await marquerSansSuite({ courrierId, commentaireTraitement: commentaire });
      toast.success("Courrier classé sans suite");
      await charger();
    } catch (error: any) {
      toast.error(error.message || "Erreur");
    }
  };

  const getDelai = (courrier: CourrierAvecRelations) => {
    const jours = differenceInDays(
      new Date(),
      new Date(courrier.datePassage)
    );
    if (jours === 0) return "Aujourd'hui";
    if (jours === 1) return "Hier";
    return `Il y a ${jours} jours`;
  };

  if (chargement) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-3 mb-6">
          <FileCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Courrier à traiter</h1>
            <p className="text-sm text-muted-foreground">
              Suivi du traitement du courrier arrivée
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
      <div className="flex items-center gap-3 mb-6">
        <FileCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-semibold">Courrier à traiter</h1>
          <p className="text-sm text-muted-foreground">
            {aTraiterCount} courrier{aTraiterCount !== 1 ? "s" : ""} en attente de
            traitement
          </p>
        </div>
      </div>

      {courriers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun courrier à traiter.
        </div>
      ) : (
        <>
          <div className="border rounded-xl shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">NUMÉRO</TableHead>
                  <TableHead className="w-[110px]">REÇU LE</TableHead>
                  <TableHead className="w-[110px]">DÉLAI</TableHead>
                  <TableHead>EXPÉDITEUR</TableHead>
                  <TableHead>OBJET</TableHead>
                  <TableHead className="w-[150px]">DESTINATAIRE</TableHead>
                  <TableHead className="w-[120px]">STATUT</TableHead>
                  <TableHead className="w-[140px] text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courriers.map((courrier) => (
                  <TableRow key={courrier.id}>
                    <TableCell className="font-medium tabular-nums">
                      {courrier.numero}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {format(new Date(courrier.datePassage), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getDelai(courrier)}
                    </TableCell>
                    <TableCell>
                      {courrier.tiers}
                      {courrier.referenceTiers && (
                        <span className="text-xs text-muted-foreground ml-2">
                          · {courrier.referenceTiers}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate">
                      {courrier.objet}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {courrier.service?.libelle ||
                        courrier.direction?.libelle ||
                        "—"}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          variant={STATUT_VARIANTS[courrier.statutTraitement]}
                        >
                          {STATUT_LABELS[courrier.statutTraitement]}
                        </Badge>
                        {courrier.traitePar && (
                          <div className="text-xs text-muted-foreground">
                            par {courrier.traitePar.email.split("@")[0]}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {courrier.statutTraitement === "A_TRAITER" && (
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarquerTraite(courrier.id)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Traité
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarquerSansSuite(courrier.id)}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Sans suite
                          </Button>
                        </div>
                      )}
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
