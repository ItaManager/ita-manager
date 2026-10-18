"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, PackageCheck } from "lucide-react";
import { listerDemandesRechargement } from "@/lib/actions/carburant";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ModalReceptionRechargement } from "./modal-reception-rechargement";

const STATUT_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  ATTENTE_VALIDATION: "En attente",
  VALIDEE: "Validée",
  LIVREE: "Livrée",
  REFUSEE: "Refusée",
};

const STATUT_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  BROUILLON: "outline",
  ATTENTE_VALIDATION: "default",
  VALIDEE: "secondary",
  LIVREE: "secondary",
  REFUSEE: "destructive",
};

type DemandeRechargement = {
  id: string;
  reference: string;
  demandeur: { nom: string; prenom: string };
  garage: { libelle: string };
  typeCarburant: string;
  quantiteDemandee: any;
  quantiteLivree?: any;
  statut: string;
  creeLe: Date;
  projet?: { code: string; nom: string } | null;
};

interface Props {
  onRefresh: () => void;
}

export function OngletRechargements({ onRefresh }: Props) {
  const [demandes, setDemandes] = useState<DemandeRechargement[]>([]);
  const [chargement, setChargement] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState<string>("all");

  const [modalReceptionOpen, setModalReceptionOpen] = useState(false);
  const [demandeSelectionnee, setDemandeSelectionnee] = useState<DemandeRechargement | null>(
    null
  );

  const charger = async () => {
    setChargement(true);
    try {
      const data = await listerDemandesRechargement({
        page: 1,
        limit: 100,
        statut: filtreStatut === "all" ? undefined : filtreStatut,
      });
      setDemandes(data.demandes as any);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, [filtreStatut]);

  const handleReceptionner = (demande: DemandeRechargement) => {
    setDemandeSelectionnee(demande);
    setModalReceptionOpen(true);
  };

  const handleSuccess = () => {
    charger();
    onRefresh();
  };

  if (chargement) {
    return <div className="text-center py-12 text-muted-foreground">Chargement...</div>;
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <Select value={filtreStatut} onValueChange={setFiltreStatut}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="BROUILLON">Brouillon</SelectItem>
            <SelectItem value="ATTENTE_VALIDATION">En attente</SelectItem>
            <SelectItem value="VALIDEE">Validée</SelectItem>
            <SelectItem value="LIVREE">Livrée</SelectItem>
            <SelectItem value="REFUSEE">Refusée</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto text-sm text-muted-foreground">
          {demandes.length} demande{demandes.length !== 1 ? "s" : ""}
        </div>
      </div>

      {demandes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-xl">
          Aucune demande de rechargement trouvée.
        </div>
      ) : (
        <div className="border rounded-xl shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">RÉFÉRENCE</TableHead>
                <TableHead className="w-[110px]">DATE</TableHead>
                <TableHead>GARAGE</TableHead>
                <TableHead>DEMANDEUR</TableHead>
                <TableHead>TYPE</TableHead>
                <TableHead className="text-right w-[120px]">QTÉ DEMANDÉE</TableHead>
                <TableHead className="text-right w-[120px]">QTÉ LIVRÉE</TableHead>
                <TableHead>PROJET</TableHead>
                <TableHead>STATUT</TableHead>
                <TableHead className="text-right w-[120px]">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demandes.map((demande) => (
                <TableRow key={demande.id}>
                  <TableCell className="font-medium font-mono text-xs">
                    {demande.reference}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(demande.creeLe), "d MMM yy", { locale: fr })}
                  </TableCell>
                  <TableCell>{demande.garage.libelle}</TableCell>
                  <TableCell>
                    {demande.demandeur.prenom} {demande.demandeur.nom}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{demande.typeCarburant}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number(demande.quantiteDemandee).toFixed(2)} L
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {demande.quantiteLivree
                      ? `${Number(demande.quantiteLivree).toFixed(2)} L`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {demande.projet?.code || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUT_VARIANTS[demande.statut]}>
                      {STATUT_LABELS[demande.statut]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {demande.statut === "VALIDEE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReceptionner(demande)}
                      >
                        <PackageCheck className="h-4 w-4 mr-1" />
                        Réceptionner
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {demandeSelectionnee && (
        <ModalReceptionRechargement
          open={modalReceptionOpen}
          onOpenChange={setModalReceptionOpen}
          demande={demandeSelectionnee}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
