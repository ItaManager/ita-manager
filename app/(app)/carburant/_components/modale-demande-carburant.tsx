"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ModaleDemandeCarburantProps {
  ouvert: boolean;
  onClose: () => void;
}

export function ModaleDemandeCarburant({
  ouvert,
  onClose,
}: ModaleDemandeCarburantProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [materielId, setMaterielId] = useState("");
  const [typeCarburant, setTypeCarburant] = useState("GASOIL");
  const [quantiteSouhai, setQuantiteSouhai] = useState("");
  const [compteurActuel, setCompteurActuel] = useState("");
  const [uniteCompteur, setUniteCompteur] = useState("KILOMETRE");
  const [circuit, setCircuit] = useState("STATION");
  const [projetId, setProjetId] = useState("");

  // Infos du véhicule sélectionné (TODO: récupérer depuis la base)
  const vehiculeInfo = materielId
    ? {
        chauffeur: materielId === "vl-001" ? "KOUASSI Jean" : materielId === "vl-002" ? "TOURE Ibrahim" : "N'GUESSAN François",
        typeCarburant: materielId === "eg-001" ? "GASOIL" : "SUPER",
        dernierCompteur: materielId === "vl-001" ? "12450" : materielId === "vl-002" ? "8920" : "3200",
        uniteCompteur: materielId === "eg-001" ? "HEURE" : "KILOMETRE",
      }
    : null;

  // Options pour les combobox
  const materielsOptions: ComboboxOption[] = [
    { value: "vl-001", label: "VL-001 — Pick-up Toyota", description: "Chauffeur: KOUASSI Jean" },
    { value: "vl-002", label: "VL-002 — Camion Mercedes", description: "Chauffeur: TOURE Ibrahim" },
    { value: "eg-001", label: "EG-001 — Pelle CAT", description: "Chauffeur: N'GUESSAN François" },
  ];

  const typeCarburantOptions: ComboboxOption[] = [
    { value: "GASOIL", label: "Gasoil" },
    { value: "SUPER", label: "Super" },
  ];

  const uniteCompteurOptions: ComboboxOption[] = [
    { value: "KILOMETRE", label: "Kilomètres" },
    { value: "HEURE", label: "Heures" },
  ];

  const circuitOptions: ComboboxOption[] = [
    { value: "STATION", label: "Station-service" },
    { value: "GARAGE", label: "Garage ITA" },
  ];

  const projetsOptions: ComboboxOption[] = [
    { value: "", label: "Aucun projet" },
    { value: "p-001", label: "PRJ-001 — Construction immeuble" },
    { value: "p-002", label: "PRJ-002 — Route nationale" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!materielId) {
      toast.error("Le véhicule est requis");
      return;
    }
    if (!quantiteSouhai || parseFloat(quantiteSouhai) <= 0) {
      toast.error("La quantité souhaitée est requise");
      return;
    }
    if (!compteurActuel || parseFloat(compteurActuel) < 0) {
      toast.error("Le compteur actuel est requis");
      return;
    }

    startTransition(async () => {
      // TODO: Appeler l'action serveur creerDemandeCarburant
      toast.success("Demande créée avec succès");

      // Réinitialiser le formulaire
      setMaterielId("");
      setTypeCarburant("GASOIL");
      setQuantiteSouhai("");
      setCompteurActuel("");
      setUniteCompteur("KILOMETRE");
      setCircuit("STATION");
      setProjetId("");

      // Fermer le modal
      onClose();

      // Rafraîchir la page
      router.refresh();
    });
  };

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="border-b border-border px-6 py-4" style={{ backgroundColor: 'var(--primary-soft)' }}>
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            Nouvelle demande de carburant
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Créez une demande de carburant pour un véhicule ou engin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-4">
          {/* Demandeur (utilisateur connecté) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Demandeur
            </Label>
            <Input
              value="Armel GNAKPA (vous)"
              disabled
              className="h-11 bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Votre compte est automatiquement enregistré comme demandeur
            </p>
          </div>

          {/* Véhicule */}
          <div className="space-y-2">
            <Label htmlFor="materiel" className="text-sm font-medium">
              Véhicule / Engin <span className="text-destructive">*</span>
            </Label>
            <Combobox
              options={materielsOptions}
              value={materielId}
              onChange={(value) => {
                setMaterielId(value);
                // Pré-remplir selon le véhicule
                const info = value === "vl-001"
                  ? { carburant: "SUPER", unite: "KILOMETRE" }
                  : value === "vl-002"
                  ? { carburant: "SUPER", unite: "KILOMETRE" }
                  : { carburant: "GASOIL", unite: "HEURE" };

                setTypeCarburant(info.carburant);
                setUniteCompteur(info.unite);
              }}
              placeholder="Sélectionner un véhicule"
              searchPlaceholder="Rechercher un véhicule..."
              emptyText="Aucun véhicule trouvé"
              variant="search"
            />
            {vehiculeInfo && (
              <p className="text-xs text-muted-foreground">
                Chauffeur : {vehiculeInfo.chauffeur}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Type de carburant */}
            <div className="space-y-2">
              <Label htmlFor="typeCarburant" className="text-sm font-medium">
                Type de carburant <span className="text-destructive">*</span>
              </Label>
              <Combobox
                options={typeCarburantOptions}
                value={typeCarburant}
                onChange={setTypeCarburant}
                placeholder="Type de carburant"
                searchPlaceholder="Rechercher..."
              />
            </div>

            {/* Quantité souhaitée */}
            <div className="space-y-2">
              <Label htmlFor="quantite" className="text-sm font-medium">
                Quantité (litres) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantite"
                type="number"
                step="0.01"
                min="0"
                placeholder="50.00"
                value={quantiteSouhai}
                onChange={(e) => setQuantiteSouhai(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Compteur actuel */}
            <div className="space-y-2">
              <Label htmlFor="compteur" className="text-sm font-medium">
                Compteur actuel <span className="text-destructive">*</span>
              </Label>
              <Input
                id="compteur"
                type="number"
                step="0.01"
                min="0"
                placeholder="12500"
                value={compteurActuel}
                onChange={(e) => setCompteurActuel(e.target.value)}
                className="h-11"
              />
              {vehiculeInfo && (
                <p className="text-xs text-muted-foreground">
                  Dernier relevé : {vehiculeInfo.dernierCompteur} {vehiculeInfo.uniteCompteur === "KILOMETRE" ? "km" : "h"}
                </p>
              )}
            </div>

            {/* Unité compteur */}
            <div className="space-y-2">
              <Label htmlFor="uniteCompteur" className="text-sm font-medium">
                Unité <span className="text-destructive">*</span>
              </Label>
              <Combobox
                options={uniteCompteurOptions}
                value={uniteCompteur}
                onChange={setUniteCompteur}
                placeholder="Unité"
                searchPlaceholder="Rechercher..."
              />
            </div>
          </div>

          {/* Circuit */}
          <div className="space-y-2">
            <Label htmlFor="circuit" className="text-sm font-medium">
              Circuit <span className="text-destructive">*</span>
            </Label>
            <Combobox
              options={circuitOptions}
              value={circuit}
              onChange={setCircuit}
              placeholder="Circuit"
              searchPlaceholder="Rechercher..."
            />
            <p className="text-xs text-muted-foreground">
              {circuit === "STATION"
                ? "Le carburant sera acheté en station-service"
                : "Le carburant sera pris des cuves du garage ITA"}
            </p>
          </div>

          {/* Projet (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="projet" className="text-sm font-medium">
              Projet (optionnel)
            </Label>
            <Combobox
              options={projetsOptions}
              value={projetId}
              onChange={setProjetId}
              placeholder="Aucun projet"
              searchPlaceholder="Rechercher un projet..."
              emptyText="Aucun projet trouvé"
              variant="search"
            />
            <p className="text-xs text-muted-foreground">
              Imputation du coût sur un projet chantier
            </p>
          </div>

          <DialogFooter className="border-t border-border pt-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
