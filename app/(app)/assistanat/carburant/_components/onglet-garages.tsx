"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Plus, Warehouse } from "lucide-react";
import { listerGarages } from "@/lib/actions/carburant";
import { toast } from "sonner";
import { ModalDemandeRechargement } from "./modal-demande-rechargement";

type Garage = {
  id: string;
  libelle: string;
  stockActuel: number;
  capaciteCarburant: number;
  seuilAlerte?: number | null;
  alerteSeuil: boolean;
  responsable?: { nom: string; prenom: string } | null;
};

interface Props {
  onRefresh: () => void;
}

export function OngletGarages({ onRefresh }: Props) {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modalRechargementOpen, setModalRechargementOpen] = useState(false);
  const [garageSelectionne, setGarageSelectionne] = useState<Garage | null>(null);

  const charger = async () => {
    setChargement(true);
    try {
      const data = await listerGarages();
      setGarages(data.garages as any);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const handleDemanderRechargement = (garage: Garage) => {
    setGarageSelectionne(garage);
    setModalRechargementOpen(true);
  };

  const handleSuccess = () => {
    charger();
    onRefresh();
  };

  if (chargement) {
    return <div className="text-center py-12 text-muted-foreground">Chargement...</div>;
  }

  if (garages.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-xl">
        Aucun garage configuré.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {garages.map((garage) => {
          const pourcentage = garage.capaciteCarburant > 0
            ? (garage.stockActuel / garage.capaciteCarburant) * 100
            : 0;

          return (
            <Card key={garage.id} className={garage.alerteSeuil ? "border-warning" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{garage.libelle}</CardTitle>
                  </div>
                  {garage.alerteSeuil && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Niveau bas
                    </Badge>
                  )}
                </div>
                {garage.responsable && (
                  <p className="text-xs text-muted-foreground">
                    Resp.: {garage.responsable.prenom} {garage.responsable.nom}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Stock actuel</span>
                    <span className="text-sm tabular-nums">
                      {garage.stockActuel.toLocaleString("fr-FR")} L
                    </span>
                  </div>
                  <Progress value={pourcentage} className="h-2" />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {pourcentage.toFixed(0)}% de capacité
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Cap.: {garage.capaciteCarburant.toLocaleString("fr-FR")} L
                    </span>
                  </div>
                  {garage.seuilAlerte && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Seuil d'alerte: {garage.seuilAlerte}%
                    </div>
                  )}
                </div>

                <Button
                  variant={garage.alerteSeuil ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => handleDemanderRechargement(garage)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Demander rechargement
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {garageSelectionne && (
        <ModalDemandeRechargement
          open={modalRechargementOpen}
          onOpenChange={setModalRechargementOpen}
          garage={garageSelectionne}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
