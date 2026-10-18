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
import { CheckCircle, XCircle, Eye, Fuel } from "lucide-react";
import { listerDemandesCarburant } from "@/lib/actions/carburant";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ModalValiderDemande } from "./modal-valider-demande";
import type { ModalDistribuerGarage as ModalDistribuerGarageComp } from "./modal-distribuer-garage";
// Import dynamique pour éviter conflit de types
const ModalDistribuerGarage = require("./modal-distribuer-garage").ModalDistribuerGarage;

const STATUT_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  ATTENTE_VALIDATION: "En attente",
  VALIDEE: "Validée",
  DISTRIBUEE: "Distribuée",
  REFUSEE: "Refusée",
};

const STATUT_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  BROUILLON: "outline",
  ATTENTE_VALIDATION: "default",
  VALIDEE: "secondary",
  DISTRIBUEE: "secondary",
  REFUSEE: "destructive",
};

const CIRCUIT_LABELS: Record<string, string> = {
  STATION: "Station",
  GARAGE: "Garage",
};

type Demande = {
  id: string;
  reference: string;
  demandeur: { nom: string; prenom: string };
  materiel: { codeIta: string; designation: string };
  circuit: string;
  typeCarburant: string;
  quantiteSouhai: any;
  compteurActuel: any;
  statut: string;
  creeLe: Date;
  garage?: { libelle: string; id?: string; stockActuel?: number } | null;
  projet?: { code: string; nom: string } | null;
};

interface Props {
  onRefresh: () => void;
}

export function OngletDemandes({ onRefresh }: Props) {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [chargement, setChargement] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState<string>("all");
  const [filtreCircuit, setFiltreCircuit] = useState<string>("all");

  const [modalValiderOpen, setModalValiderOpen] = useState(false);
  const [modalDistribuerOpen, setModalDistribuerOpen] = useState(false);
  const [demandeSelectionnee, setDemandeSelectionnee] = useState<Demande | null>(null);

  const charger = async () => {
    setChargement(true);
    try {
      const data = await listerDemandesCarburant({
        page: 1,
        limit: 100,
        statut: filtreStatut === "all" ? undefined : filtreStatut,
        circuit: filtreCircuit === "all" ? undefined : filtreCircuit,
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
  }, [filtreStatut, filtreCircuit]);

  const handleValider = (demande: Demande) => {
    setDemandeSelectionnee(demande);
    setModalValiderOpen(true);
  };

  const handleDistribuer = (demande: Demande) => {
    setDemandeSelectionnee(demande);
    setModalDistribuerOpen(true);
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
            <SelectItem value="DISTRIBUEE">Distribuée</SelectItem>
            <SelectItem value="REFUSEE">Refusée</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtreCircuit} onValueChange={setFiltreCircuit}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Circuit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les circuits</SelectItem>
            <SelectItem value="STATION">Station</SelectItem>
            <SelectItem value="GARAGE">Garage</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto text-sm text-muted-foreground">
          {demandes.length} demande{demandes.length !== 1 ? "s" : ""}
        </div>
      </div>

      {demandes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-xl">
          Aucune demande trouvée.
        </div>
      ) : (
        <div className="border rounded-xl shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">RÉFÉRENCE</TableHead>
                <TableHead className="w-[110px]">DATE</TableHead>
                <TableHead>DEMANDEUR</TableHead>
                <TableHead>MATÉRIEL</TableHead>
                <TableHead>CIRCUIT</TableHead>
                <TableHead className="text-right w-[100px]">QUANTITÉ</TableHead>
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
                  <TableCell>
                    {demande.demandeur.prenom} {demande.demandeur.nom}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{demande.materiel.codeIta}</div>
                      <div className="text-xs text-muted-foreground">
                        {demande.materiel.designation}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {CIRCUIT_LABELS[demande.circuit]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number(demande.quantiteSouhai).toFixed(2)} L
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
                    <div className="flex items-center justify-end gap-2">
                      {demande.statut === "ATTENTE_VALIDATION" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleValider(demande)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Valider
                        </Button>
                      )}
                      {demande.statut === "VALIDEE" && demande.circuit === "GARAGE" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDistribuer(demande)}
                        >
                          <Fuel className="h-4 w-4 mr-1" />
                          Distribuer
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {demandeSelectionnee && (
        <>
          <ModalValiderDemande
            open={modalValiderOpen}
            onOpenChange={setModalValiderOpen}
            demande={demandeSelectionnee}
            onSuccess={handleSuccess}
          />
          <ModalDistribuerGarage
            open={modalDistribuerOpen}
            onOpenChange={setModalDistribuerOpen}
            demande={demandeSelectionnee}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </>
  );
}
