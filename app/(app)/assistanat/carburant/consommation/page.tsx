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
import { BarChart3, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { calculerConsommation } from "@/lib/actions/carburant";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ConsommationData = {
  materielId: string;
  codeIta: string;
  designation: string;
  resultat: any; // Type from calculerConsommation is complex, using any for now
};

export default function ConsommationPage() {
  const [consommations, setConsommations] = useState<ConsommationData[]>([]);
  const [chargement, setChargement] = useState(true);
  const [filtreType, setFiltreType] = useState<string>("TOUS");

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    try {
      // TODO: Charger la liste des matériels depuis M13
      // Pour l'instant, on simule avec un tableau vide
      const materiels: Array<{
        id: string;
        codeIta: string;
        designation: string;
        type: string;
      }> = [];

      const resultats = await Promise.all(
        materiels.map(async (materiel) => {
          const resultat = await calculerConsommation(materiel.id);
          return {
            materielId: materiel.id,
            codeIta: materiel.codeIta,
            designation: materiel.designation,
            resultat,
          };
        })
      );

      setConsommations(resultats);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement");
    } finally {
      setChargement(false);
    }
  };

  const getEcartVariant = (ecart: number) => {
    const abs = Math.abs(ecart);
    if (abs < 5) return "outline";
    if (abs < 15) return "warning";
    return "destructive";
  };

  const getEcartIcon = (ecart: number) => {
    if (ecart > 5) return <TrendingUp className="h-3 w-3" />;
    if (ecart < -5) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const consommationsFiltrees = consommations.filter((c) => {
    if (filtreType === "TOUS") return true;
    // TODO: Filter by material type when material data is available
    return true;
  });

  const consommationsCalculees = consommationsFiltrees.filter(
    (c) => c.resultat.type === "CALCULE"
  );

  const consommationsEnAttente = consommationsFiltrees.filter(
    (c) => c.resultat.type === "EN_ATTENTE"
  );

  if (chargement) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Consommations de carburant</h1>
            <p className="text-sm text-muted-foreground">
              Analyse des consommations par matériel
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
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Consommations de carburant</h1>
            <p className="text-sm text-muted-foreground">
              {consommationsCalculees.length} matériel
              {consommationsCalculees.length !== 1 ? "s" : ""} avec calcul ·{" "}
              {consommationsEnAttente.length} en attente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={filtreType} onValueChange={setFiltreType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TOUS">Tous les types</SelectItem>
              <SelectItem value="VEHICULE_LEGER">Véhicules légers</SelectItem>
              <SelectItem value="VEHICULE_LOURD">Véhicules lourds</SelectItem>
              <SelectItem value="ENGIN">Engins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* MATÉRIELS AVEC CALCUL */}
      {consommationsCalculees.length > 0 && (
        <div className="mb-8">
          <div className="border rounded-xl shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MATÉRIEL</TableHead>
                  <TableHead className="text-right w-[120px]">MOYENNE</TableHead>
                  <TableHead className="text-right w-[120px]">DERNIER</TableHead>
                  <TableHead className="w-[140px]">ÉCART</TableHead>
                  <TableHead className="text-center w-[100px]">INTERVALLES</TableHead>
                  <TableHead className="w-[130px]">DERNIER PLEIN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consommationsCalculees.map((c) => {
                  if (c.resultat.type !== "CALCULE") return null;
                  const r = c.resultat;

                  return (
                    <TableRow key={c.materielId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{c.codeIta}</div>
                          <div className="text-xs text-muted-foreground">
                            {c.designation}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {r.moyenneConsommation.toFixed(1)} {r.unite}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.dernierCalcul.toFixed(1)} {r.unite}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={getEcartVariant(r.ecartPourcent)}>
                            <span className="flex items-center gap-1">
                              {getEcartIcon(r.ecartPourcent)}
                              {r.ecartPourcent > 0 ? "+" : ""}
                              {r.ecartPourcent.toFixed(1)} %
                            </span>
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {r.nbIntervalles}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(r.dernierPlein), "d MMM yyyy", {
                          locale: fr,
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* MATÉRIELS EN ATTENTE */}
      {consommationsEnAttente.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">
              En attente de données ({consommationsEnAttente.length})
            </h2>
          </div>
          <div className="border rounded-xl shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MATÉRIEL</TableHead>
                  <TableHead>STATUT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consommationsEnAttente.map((c) => {
                  if (c.resultat.type !== "EN_ATTENTE") return null;

                  return (
                    <TableRow key={c.materielId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{c.codeIta}</div>
                          <div className="text-xs text-muted-foreground">
                            {c.designation}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.resultat.message}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {consommations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucun matériel avec distributions de carburant.
        </div>
      )}
    </div>
  );
}
