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
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { listerAnomalies } from "@/lib/actions/carburant";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Anomalie = {
  materiel: {
    id: string;
    code: string;
    designation: string;
  };
  consommationMoyenne: number;
  dernierCalcul: number;
  ecartPourcent: number;
  unite: string;
  dernierPlein: Date;
};

export function OngletConsommation() {
  const [anomalies, setAnomalies] = useState<Anomalie[]>([]);
  const [chargement, setChargement] = useState(true);

  const charger = async () => {
    setChargement(true);
    try {
      const data = await listerAnomalies();
      setAnomalies(data.anomalies as any);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const getEcartIcon = (ecart: number) => {
    if (ecart > 0) return <TrendingUp className="h-4 w-4 text-destructive" />;
    if (ecart < 0) return <TrendingDown className="h-4 w-4 text-success" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getEcartVariant = (ecart: number): "default" | "secondary" | "destructive" | "outline" => {
    const abs = Math.abs(ecart);
    if (abs > 25) return "destructive";
    if (abs > 15) return "default";
    return "outline";
  };

  if (chargement) {
    return <div className="text-center py-12 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 border rounded-xl bg-muted/30">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <div>
          <h3 className="font-medium">Anomalies de consommation</h3>
          <p className="text-sm text-muted-foreground">
            Véhicules et engins avec un écart de consommation supérieur à 15%
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant="destructive" className="text-base px-3 py-1">
            {anomalies.length} anomalie{anomalies.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {anomalies.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-xl">
          Aucune anomalie détectée. Toutes les consommations sont normales.
        </div>
      ) : (
        <div className="border rounded-xl shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MATÉRIEL</TableHead>
                <TableHead>CODE</TableHead>
                <TableHead className="text-right">CONSOMMATION MOYENNE</TableHead>
                <TableHead className="text-right">DERNIER CALCUL</TableHead>
                <TableHead className="text-center">ÉCART</TableHead>
                <TableHead className="w-[130px]">DERNIER PLEIN</TableHead>
                <TableHead className="text-center">SÉVÉRITÉ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anomalies.map((anomalie) => (
                <TableRow key={anomalie.materiel.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{anomalie.materiel.designation}</div>
                      <div className="text-xs text-muted-foreground">
                        {anomalie.materiel.code}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {anomalie.materiel.code}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {anomalie.consommationMoyenne.toFixed(2)} {anomalie.unite}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {anomalie.dernierCalcul.toFixed(2)} {anomalie.unite}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getEcartIcon(anomalie.ecartPourcent)}
                      <span className="tabular-nums font-medium">
                        {anomalie.ecartPourcent > 0 ? "+" : ""}
                        {anomalie.ecartPourcent.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(anomalie.dernierPlein), "dd/MM/yyyy", {
                      locale: fr,
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getEcartVariant(anomalie.ecartPourcent)}>
                      {Math.abs(anomalie.ecartPourcent) > 25
                        ? "Critique"
                        : Math.abs(anomalie.ecartPourcent) > 15
                        ? "Élevée"
                        : "Modérée"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
