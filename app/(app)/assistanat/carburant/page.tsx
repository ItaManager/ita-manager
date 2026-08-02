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
import { Fuel, Plus, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import {
  listerDistributions,
  listerStationsService,
  listerCuves,
} from "@/lib/actions/carburant";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DistribuerModal } from "./_components/distribuer-modal";
import type { TypeCarburant, NatureDistribution } from "@prisma/client";

type Distribution = {
  id: string;
  reference: string;
  dateDistribution: Date;
  typeCarburant: TypeCarburant;
  quantite: any;
  montant: any;
  compteur: any;
  pleinComplet: boolean;
  compteurAnomalie: boolean;
  nature: NatureDistribution;
  demandeur: { nom: string; prenom: string };
  materiel: { codeIta: string; designation: string };
  station: { libelle: string } | null;
  lieuStockage: { libelle: string } | null;
};

const TYPE_LABELS: Record<TypeCarburant, string> = {
  GASOIL: "Gasoil",
  SUPER: "Super",
  MELANGE: "Mélange 2T",
};

export default function CarburantPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page") || "1");

  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [chargement, setChargement] = useState(true);

  // Données pour le formulaire
  const [employes, setEmployes] = useState<Array<{ id: string; nom: string; prenom: string }>>([]);
  const [materiels, setMateriels] = useState<Array<{ id: string; codeIta: string; designation: string }>>([]);
  const [stations, setStations] = useState<Array<{ id: string; libelle: string }>>([]);
  const [cuves, setCuves] = useState<Array<{ id: string; libelle: string; articles: Array<{ articleId: string; libelle: string }> }>>([]);

  const [modalOpen, setModalOpen] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const data = await listerDistributions(page);
      setDistributions(data.distributions as any);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement");
    } finally {
      setChargement(false);
    }
  }, [page]);

  const chargerDonneesFormulaire = useCallback(async () => {
    try {
      // TODO: Charger employes et materiels depuis les Server Actions appropriées
      // Pour l'instant, on utilise des données vides
      setEmployes([]);
      setMateriels([]);

      const [stationsData, cuvesData] = await Promise.all([
        listerStationsService(),
        listerCuves(),
      ]);

      setStations(stationsData.stations);
      setCuves(cuvesData.cuves);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des données");
    }
  }, []);

  useEffect(() => {
    charger();
    chargerDonneesFormulaire();
  }, [charger, chargerDonneesFormulaire]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  if (chargement) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-3 mb-6">
          <Fuel className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Distributions de carburant</h1>
            <p className="text-sm text-muted-foreground">
              Gestion du carburant (stations et cuves)
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
          <Fuel className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Distributions de carburant</h1>
            <p className="text-sm text-muted-foreground">
              {total} distribution{total !== 1 ? "s" : ""} enregistrée
              {total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle distribution
        </Button>
      </div>

      {distributions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucune distribution enregistrée.
        </div>
      ) : (
        <>
          <div className="border rounded-xl shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">RÉFÉRENCE</TableHead>
                  <TableHead className="w-[110px]">DATE</TableHead>
                  <TableHead>MATÉRIEL</TableHead>
                  <TableHead>DEMANDEUR</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead className="text-right w-[100px]">QUANTITÉ</TableHead>
                  <TableHead className="text-right w-[100px]">COMPTEUR</TableHead>
                  <TableHead>SOURCE</TableHead>
                  <TableHead className="w-[80px]">PLEIN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributions.map((dist) => (
                  <TableRow key={dist.id}>
                    <TableCell className="font-medium font-mono text-xs">
                      {dist.reference}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(dist.dateDistribution), "d MMM yy", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{dist.materiel.codeIta}</div>
                        <div className="text-xs text-muted-foreground">
                          {dist.materiel.designation}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {dist.demandeur.prenom} {dist.demandeur.nom}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TYPE_LABELS[dist.typeCarburant]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(dist.quantite).toFixed(2)} L
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div className="flex items-center justify-end gap-1">
                        {dist.compteurAnomalie && (
                          <AlertTriangle className="h-3 w-3 text-warning" />
                        )}
                        {Number(dist.compteur).toLocaleString("fr-FR")}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dist.nature === "STATION"
                        ? dist.station?.libelle || "—"
                        : dist.lieuStockage?.libelle || "—"}
                    </TableCell>
                    <TableCell>
                      {dist.pleinComplet ? (
                        <Badge variant="secondary">Complet</Badge>
                      ) : (
                        <Badge variant="outline">Partiel</Badge>
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

      <DistribuerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={charger}
        employes={employes}
        materiels={materiels}
        stations={stations}
        cuves={cuves}
      />
    </div>
  );
}
