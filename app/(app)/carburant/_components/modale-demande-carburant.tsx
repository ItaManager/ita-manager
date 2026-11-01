"use client";

import { useState, useTransition, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle } from "lucide-react";
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
  const [etape, setEtape] = useState(1);

  // Étape 1
  const [materielId, setMaterielId] = useState("");
  const [typeCarburant, setTypeCarburant] = useState("GASOIL");
  const [quantiteDemandee, setQuantiteDemandee] = useState("");
  const [compteurPrecedent, setCompteurPrecedent] = useState("");
  const [uniteCompteur, setUniteCompteur] = useState("KILOMETRE");
  const [circuit, setCircuit] = useState("STATION");
  const [projetId, setProjetId] = useState("");

  // Étape 2
  const [litresAjoutes, setLitresAjoutes] = useState("");
  const [compteurActuel, setCompteurActuel] = useState("");
  const [pleinComplet, setPleinComplet] = useState(true);
  const [stationId, setStationId] = useState("");
  const [lieuStockageId, setLieuStockageId] = useState("");
  const [dateDistribution, setDateDistribution] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Étape 3
  const [montant, setMontant] = useState("");
  const [modePaiement, setModePaiement] = useState("");
  const [numeroFacture, setNumeroFacture] = useState("");

  // Auto-remplissage
  useEffect(() => {
    if (quantiteDemandee && !litresAjoutes) {
      setLitresAjoutes(quantiteDemandee);
    }
  }, [quantiteDemandee, litresAjoutes]);

  useEffect(() => {
    if (compteurPrecedent && !compteurActuel) {
      setCompteurActuel(compteurPrecedent);
    }
  }, [compteurPrecedent, compteurActuel]);

  // Calculs
  const kmParcourus = compteurActuel && compteurPrecedent
    ? Math.max(0, parseFloat(compteurActuel) - parseFloat(compteurPrecedent))
    : 0;

  const consommation = kmParcourus > 0 && litresAjoutes && uniteCompteur === "KILOMETRE"
    ? ((parseFloat(litresAjoutes) / kmParcourus) * 100).toFixed(2)
    : null;

  // Options
  const materielsOptions: ComboboxOption[] = [
    { value: "vl-001", label: "VL-001 — Pick-up Toyota" },
    { value: "vl-002", label: "VL-002 — Camion Mercedes" },
    { value: "eg-001", label: "EG-001 — Pelle CAT" },
  ];

  const typeCarburantOptions: ComboboxOption[] = [
    { value: "GASOIL", label: "Gasoil" },
    { value: "SUPER", label: "Super" },
    { value: "MELANGE", label: "Mélange 2T" },
  ];

  const uniteCompteurOptions: ComboboxOption[] = [
    { value: "KILOMETRE", label: "Kilomètres" },
    { value: "HEURE", label: "Heures" },
  ];

  const circuitOptions: ComboboxOption[] = [
    { value: "STATION", label: "Station-service" },
    { value: "CUVE", label: "Cuve ITA" },
  ];

  const projetsOptions: ComboboxOption[] = [
    { value: "", label: "Aucun projet" },
    { value: "p-001", label: "PRJ-001 — Construction immeuble" },
    { value: "p-002", label: "PRJ-002 — Route nationale" },
  ];

  const stationsOptions: ComboboxOption[] = [
    { value: "s-001", label: "Total Marcory" },
    { value: "s-002", label: "Shell Plateau" },
    { value: "s-003", label: "Pétro Ivoire Koumassi" },
  ];

  const cuvesOptions: ComboboxOption[] = [
    { value: "c-001", label: "Cuve Garage Principal — Gasoil" },
    { value: "c-002", label: "Cuve Garage Principal — Super" },
  ];

  const modePaiementOptions: ComboboxOption[] = [
    { value: "ESPECES", label: "Espèces" },
    { value: "CARTE_BANCAIRE", label: "Carte bancaire" },
    { value: "BON_CARBURANT", label: "Bon carburant" },
    { value: "VIREMENT", label: "Virement" },
    { value: "COMPTE_ENTREPRISE", label: "Compte entreprise" },
  ];

  const handleEtapeSuivante = () => {
    if (etape === 1) {
      if (!materielId) return toast.error("Le véhicule est requis");
      if (!quantiteDemandee || parseFloat(quantiteDemandee) <= 0) return toast.error("La quantité demandée est requise");
      if (!compteurPrecedent || parseFloat(compteurPrecedent) < 0) return toast.error("Le compteur précédent est requis");
      if (circuit === "STATION" && !stationId) return toast.error("La station est requise");
      if (circuit === "CUVE" && !lieuStockageId) return toast.error("La cuve est requise");
      setEtape(2);
    } else if (etape === 2) {
      if (!litresAjoutes || parseFloat(litresAjoutes) <= 0) return toast.error("Les litres ajoutés sont requis");
      if (!compteurActuel || parseFloat(compteurActuel) < 0) return toast.error("Le compteur actuel est requis");
      if (parseFloat(compteurActuel) < parseFloat(compteurPrecedent)) return toast.error("Le compteur actuel ne peut pas être inférieur au compteur précédent");
      if (circuit === "STATION") {
        setEtape(3);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    if (circuit === "STATION" && !modePaiement) {
      return toast.error("Le mode de paiement est requis");
    }

    startTransition(async () => {
      try {
        const data = {
          demandeurId: "user-id-todo",
          materielId,
          typeCarburant,
          quantite: parseFloat(quantiteDemandee),
          litresAjoutes: parseFloat(litresAjoutes),
          compteurPrecedent: parseFloat(compteurPrecedent),
          compteur: parseFloat(compteurActuel),
          pleinComplet,
          nature: circuit as "STATION" | "CUVE",
          stationId: circuit === "STATION" ? stationId : undefined,
          lieuStockageId: circuit === "CUVE" ? lieuStockageId : undefined,
          dateDistribution: new Date(dateDistribution),
          montant: montant ? parseFloat(montant) : undefined,
          modePaiement: modePaiement || undefined,
          numeroFacture: numeroFacture || undefined,
        };

        console.log("Distribution à créer :", data);
        toast.success("Distribution créée avec succès");
        resetFormulaire();
        onClose();
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la création");
      }
    });
  };

  const resetFormulaire = () => {
    setEtape(1);
    setMaterielId("");
    setTypeCarburant("GASOIL");
    setQuantiteDemandee("");
    setCompteurPrecedent("");
    setLitresAjoutes("");
    setCompteurActuel("");
    setPleinComplet(true);
    setStationId("");
    setLieuStockageId("");
    setMontant("");
    setModePaiement("");
    setNumeroFacture("");
  };

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border px-6 py-4" style={{ backgroundColor: 'var(--primary-soft)' }}>
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            Distribution de carburant
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Étape {etape}/{circuit === "STATION" ? 3 : 2} : {etape === 1 ? "Véhicule et demande" : etape === 2 ? "Distribution réelle" : "Paiement"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-4">
          {/* ÉTAPE 1 : VÉHICULE ET DEMANDE */}
          {etape === 1 && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Demandeur</Label>
                <Input value="Armel GNAKPA (vous)" disabled className="h-11 bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Votre compte est automatiquement enregistré comme demandeur
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Véhicule / Engin <span className="text-destructive">*</span>
                </Label>
                <Combobox
                  options={materielsOptions}
                  value={materielId}
                  onChange={setMaterielId}
                  placeholder="Sélectionner un véhicule"
                  searchPlaceholder="Rechercher..."
                  variant="search"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Type de carburant <span className="text-destructive">*</span>
                  </Label>
                  <Combobox
                    options={typeCarburantOptions}
                    value={typeCarburant}
                    onChange={setTypeCarburant}
                    placeholder="Type"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Quantité demandée (L) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="50.00"
                    value={quantiteDemandee}
                    onChange={(e) => setQuantiteDemandee(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Compteur kilométrique avant <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="12500"
                    value={compteurPrecedent}
                    onChange={(e) => setCompteurPrecedent(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dernier relevé avant la distribution
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Unité <span className="text-destructive">*</span>
                  </Label>
                  <Combobox
                    options={uniteCompteurOptions}
                    value={uniteCompteur}
                    onChange={setUniteCompteur}
                    placeholder="Unité"
                  />
                  <p className="text-xs text-muted-foreground">
                    {uniteCompteur === "KILOMETRE" ? "Pour véhicules" : "Pour engins"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Circuit <span className="text-destructive">*</span>
                </Label>
                <Combobox
                  options={circuitOptions}
                  value={circuit}
                  onChange={setCircuit}
                  placeholder="Circuit"
                />
                <p className="text-xs text-muted-foreground">
                  {circuit === "STATION"
                    ? "Le carburant sera acheté en station-service"
                    : "Le carburant sera pris des cuves du garage ITA"}
                </p>
              </div>

              {circuit === "STATION" ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Station <span className="text-destructive">*</span>
                  </Label>
                  <Combobox
                    options={stationsOptions}
                    value={stationId}
                    onChange={setStationId}
                    placeholder="Sélectionner une station"
                    variant="search"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Cuve <span className="text-destructive">*</span>
                  </Label>
                  <Combobox
                    options={cuvesOptions}
                    value={lieuStockageId}
                    onChange={setLieuStockageId}
                    placeholder="Sélectionner une cuve"
                    variant="search"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Projet (optionnel)</Label>
                <Combobox
                  options={projetsOptions}
                  value={projetId}
                  onChange={setProjetId}
                  placeholder="Aucun projet"
                  variant="search"
                />
              </div>
            </>
          )}

          {/* ÉTAPE 2 : DISTRIBUTION RÉELLE */}
          {etape === 2 && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Date de distribution <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={dateDistribution}
                  onChange={(e) => setDateDistribution(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quantité demandée (L)</Label>
                  <Input value={quantiteDemandee} disabled className="h-11 bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Litres réellement ajoutés <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="50.00"
                    value={litresAjoutes}
                    onChange={(e) => setLitresAjoutes(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Peut différer de la quantité demandée
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Compteur kilométrique avant</Label>
                  <Input value={compteurPrecedent} disabled className="h-11 bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    Relevé à l'étape 1
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Compteur kilométrique après <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="12550"
                    value={compteurActuel}
                    onChange={(e) => setCompteurActuel(e.target.value)}
                    className="h-11"
                  />
                  {kmParcourus > 0 && (
                    <p className="text-xs" style={{ color: '#13850b' }}>
                      ✓ {kmParcourus.toFixed(2)} {uniteCompteur === "KILOMETRE" ? "km" : "h"} parcourus
                      {consommation && ` • ${consommation} L/100km`}
                    </p>
                  )}
                  {!kmParcourus && (
                    <p className="text-xs text-muted-foreground">
                      Relevé au moment de la distribution
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pleinComplet"
                  checked={pleinComplet}
                  onCheckedChange={(checked) => setPleinComplet(checked as boolean)}
                />
                <Label htmlFor="pleinComplet" className="font-normal">
                  Plein complet (réservoir rempli entièrement)
                </Label>
              </div>
            </>
          )}

          {/* ÉTAPE 3 : PAIEMENT (station uniquement) */}
          {etape === 3 && circuit === "STATION" && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Montant (FCFA) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  step="1"
                  placeholder="25000"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="h-11"
                />
                {litresAjoutes && montant && (
                  <p className="text-xs text-muted-foreground">
                    Prix/litre : {(parseFloat(montant) / parseFloat(litresAjoutes)).toFixed(0)} FCFA
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Mode de paiement <span className="text-destructive">*</span>
                </Label>
                <Combobox
                  options={modePaiementOptions}
                  value={modePaiement}
                  onChange={setModePaiement}
                  placeholder="Sélectionner"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Numéro de facture (optionnel)</Label>
                <Input
                  placeholder="FAC-2025-001"
                  value={numeroFacture}
                  onChange={(e) => setNumeroFacture(e.target.value)}
                  className="h-11"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          {etape > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setEtape(etape - 1)}
              disabled={isPending}
            >
              Retour
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetFormulaire();
              onClose();
            }}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (etape < 3 && circuit === "STATION") {
                handleEtapeSuivante();
              } else if (etape < 2) {
                handleEtapeSuivante();
              } else {
                handleSubmit();
              }
            }}
            disabled={isPending}
            style={{ backgroundColor: '#13850b' }}
            className="hover:opacity-90 text-white"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {etape === 3 || (etape === 2 && circuit === "CUVE") ? "Créer la distribution" : "Suivant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
