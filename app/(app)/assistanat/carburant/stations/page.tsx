"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { MapPin, Plus } from "lucide-react";
import {
  creerStationService,
  listerStationsService,
} from "@/lib/actions/carburant";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Station = {
  id: string;
  libelle: string;
  localisation: string | null;
  actif: boolean;
};

type StationFormData = {
  libelle: string;
  localisation?: string;
};

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StationFormData>();

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    setChargement(true);
    try {
      const data = await listerStationsService();
      setStations(data.stations);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement");
    } finally {
      setChargement(false);
    }
  };

  const onSubmit = async (data: StationFormData) => {
    try {
      setSubmitting(true);

      const result = await creerStationService(data.libelle, data.localisation);

      if (result.success) {
        if (result.cree) {
          toast.success(`Station "${result.station.libelle}" créée`);
        } else {
          toast.info(`Station "${result.station.libelle}" existe déjà`);
        }
        reset();
        setModalOpen(false);
        charger();
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  if (chargement) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Stations-service</h1>
            <p className="text-sm text-muted-foreground">
              Référentiel des stations-service
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
          <MapPin className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Stations-service</h1>
            <p className="text-sm text-muted-foreground">
              {stations.length} station{stations.length !== 1 ? "s" : ""}{" "}
              enregistrée{stations.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle station
        </Button>
      </div>

      {stations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">Aucune station-service enregistrée.</p>
          <Button onClick={() => setModalOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Créer la première station
          </Button>
        </div>
      ) : (
        <div className="border rounded-xl shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>LIBELLÉ</TableHead>
                <TableHead>LOCALISATION</TableHead>
                <TableHead className="w-[100px]">STATUT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stations.map((station) => (
                <TableRow key={station.id}>
                  <TableCell className="font-medium">{station.libelle}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {station.localisation || "—"}
                  </TableCell>
                  <TableCell>
                    {station.actif ? (
                      <Badge variant="success">Actif</Badge>
                    ) : (
                      <Badge variant="outline">Inactif</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* MODAL CRÉATION */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Nouvelle station-service
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="libelle">
                Libellé <span className="text-destructive">*</span>
              </Label>
              <Input
                id="libelle"
                {...register("libelle", {
                  required: "Libellé requis",
                  minLength: {
                    value: 2,
                    message: "Minimum 2 caractères",
                  },
                })}
                placeholder="Ex: Total Abobo"
              />
              {errors.libelle && (
                <p className="text-sm text-destructive">
                  {errors.libelle.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Si cette station existe déjà, elle sera retournée sans créer de
                doublon.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="localisation">Localisation</Label>
              <Input
                id="localisation"
                {...register("localisation")}
                placeholder="Ex: Boulevard Latrille, Abobo"
              />
              <p className="text-xs text-muted-foreground">
                Adresse ou repères géographiques (optionnel)
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModalOpen(false);
                  reset();
                }}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Création..." : "Créer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
