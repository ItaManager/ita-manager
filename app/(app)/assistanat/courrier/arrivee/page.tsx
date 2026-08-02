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
import { Inbox, Plus, ChevronLeft, ChevronRight, Paperclip } from "lucide-react";
import { listerCourrierArrivee } from "@/lib/actions/courrier";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import type { Courrier, StatutTraitement } from "@prisma/client";

type CourrierAvecRelations = Courrier & {
  service: { libelle: string } | null;
  direction: { libelle: string } | null;
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

export default function CourrierArriveePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page") || "1");

  const [courriers, setCourriers] = useState<CourrierAvecRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);

  useEffect(() => {
    const charger = async () => {
      setChargement(true);
      const data = await listerCourrierArrivee(page);
      setCourriers(data.courriers);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setChargement(false);
    };
    charger();
  }, [page]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const getDelai = (courrier: CourrierAvecRelations) => {
    const jours = differenceInDays(
      new Date(courrier.datePassage),
      new Date(courrier.dateCorrespondance)
    );
    if (jours === 0) return "Même jour";
    if (jours === 1) return "1 jour";
    return `${jours} jours`;
  };

  if (chargement) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-3 mb-6">
          <Inbox className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Courrier arrivée</h1>
            <p className="text-sm text-muted-foreground">
              Registre du courrier reçu
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
        <Inbox className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-semibold">Courrier arrivée</h1>
          <p className="text-sm text-muted-foreground">
            {total} courrier{total !== 1 ? "s" : ""} reçu{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <Button onClick={() => setModalOuverte(true)} size="default">
          <Plus className="h-4 w-4 mr-2" />
          Enregistrer un courrier
        </Button>
      </div>

      {courriers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun courrier enregistré.
        </div>
      ) : (
        <>
          <div className="border rounded-xl shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">NUMÉRO</TableHead>
                  <TableHead className="w-[110px]">REÇU LE</TableHead>
                  <TableHead className="w-[110px]">DATÉ DU</TableHead>
                  <TableHead className="w-[90px]">DÉLAI</TableHead>
                  <TableHead>EXPÉDITEUR</TableHead>
                  <TableHead>OBJET</TableHead>
                  <TableHead className="w-[150px]">DESTINATAIRE</TableHead>
                  <TableHead className="w-[120px]">STATUT</TableHead>
                  <TableHead className="w-[60px]">SCAN</TableHead>
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
                    <TableCell className="tabular-nums">
                      {format(
                        new Date(courrier.dateCorrespondance),
                        "d MMM yyyy",
                        { locale: fr }
                      )}
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
                    <TableCell className="max-w-[300px] truncate">
                      {courrier.objet}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {courrier.service?.libelle ||
                        courrier.direction?.libelle ||
                        "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUT_VARIANTS[courrier.statutTraitement]}>
                        {STATUT_LABELS[courrier.statutTraitement]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {courrier.fichierId ? (
                        <Paperclip className="h-4 w-4 text-muted-foreground mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
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
