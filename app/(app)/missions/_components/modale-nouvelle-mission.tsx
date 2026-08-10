"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { creerMission } from "@/lib/actions/missions";

interface ModaleNouvelleMissionProps {
  ouvert: boolean;
  onClose: () => void;
  employeId: string;
}

type MoyenTransport = "VEHICULE_ITA" | "TRANSPORT_COMMUN" | "VEHICULE_PERSONNEL" | "AVION" | "AUTRE";
type CategorieFrais = "TRANSPORT" | "HEBERGEMENT" | "RESTAURATION" | "CARBURANT" | "PEAGE" | "COMMUNICATION" | "AUTRE";

interface LigneFrais {
  id: string;
  categorie: CategorieFrais;
  libelle: string;
  montant: number;
}

const MOYENS_TRANSPORT: Record<MoyenTransport, string> = {
  VEHICULE_ITA: "Véhicule ITA",
  TRANSPORT_COMMUN: "Transport en commun",
  VEHICULE_PERSONNEL: "Véhicule personnel",
  AVION: "Avion",
  AUTRE: "Autre",
};

const CATEGORIES_FRAIS: Record<CategorieFrais, string> = {
  TRANSPORT: "Transport",
  HEBERGEMENT: "Hébergement",
  RESTAURATION: "Restauration",
  CARBURANT: "Carburant",
  PEAGE: "Péage",
  COMMUNICATION: "Communication",
  AUTRE: "Autre",
};

export function ModaleNouvelleMission({ ouvert, onClose, employeId }: ModaleNouvelleMissionProps) {
  const [etape, setEtape] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Étape 1 : La mission
  const [objet, setObjet] = useState("");
  const [destination, setDestination] = useState("");
  const [moyenTransport, setMoyenTransport] = useState<MoyenTransport>("VEHICULE_ITA");
  const [dateDepart, setDateDepart] = useState("");
  const [dateRetour, setDateRetour] = useState("");
  const [projetId, setProjetId] = useState<string | null>(null);

  // Étape 2 : Les frais estimés
  const [lignesFrais, setLignesFrais] = useState<LigneFrais[]>([]);

  const totalFrais = lignesFrais.reduce((sum, ligne) => sum + ligne.montant, 0);

  const ajouterLigne = () => {
    setLignesFrais([
      ...lignesFrais,
      {
        id: Math.random().toString(),
        categorie: "TRANSPORT",
        libelle: "",
        montant: 0,
      },
    ]);
  };

  const supprimerLigne = (id: string) => {
    setLignesFrais(lignesFrais.filter((l) => l.id !== id));
  };

  const modifierLigne = (id: string, champ: keyof LigneFrais, valeur: any) => {
    setLignesFrais(
      lignesFrais.map((l) => (l.id === id ? { ...l, [champ]: valeur } : l))
    );
  };

  const reinitialiser = () => {
    setEtape(1);
    setObjet("");
    setDestination("");
    setMoyenTransport("VEHICULE_ITA");
    setDateDepart("");
    setDateRetour("");
    setProjetId(null);
    setLignesFrais([]);
  };

  const validerEtape1 = () => {
    if (!objet.trim()) {
      toast.error("L'objet de la mission est requis");
      return false;
    }
    if (!destination.trim()) {
      toast.error("La destination est requise");
      return false;
    }
    if (!dateDepart) {
      toast.error("La date de départ est requise");
      return false;
    }
    if (!dateRetour) {
      toast.error("La date de retour est requise");
      return false;
    }
    if (new Date(dateRetour) < new Date(dateDepart)) {
      toast.error("La date de retour ne peut pas être antérieure à la date de départ");
      return false;
    }
    return true;
  };

  const validerEtape2 = () => {
    for (const ligne of lignesFrais) {
      if (!ligne.libelle.trim()) {
        toast.error("Toutes les lignes de frais doivent avoir un libellé");
        return false;
      }
      if (ligne.montant <= 0) {
        toast.error("Toutes les lignes de frais doivent avoir un montant positif");
        return false;
      }
    }
    return true;
  };

  const soumettreMission = () => {
    startTransition(async () => {
      try {
        const resultat = await creerMission({
          employeId,
          objet,
          destination,
          moyenTransport,
          dateDepart: new Date(dateDepart),
          dateRetour: new Date(dateRetour),
          projetId,
          lignesFrais: lignesFrais.map((l) => ({
            categorie: l.categorie,
            libelle: l.libelle,
            montant: l.montant,
          })),
        });

        if (resultat.success) {
          toast.success(resultat.message);
          reinitialiser();
          onClose();
          window.location.reload();
        } else {
          toast.error(resultat.message);
        }
      } catch (error) {
        toast.error("Une erreur est survenue lors de la création de la mission");
      }
    });
  };

  const prochaine = () => {
    if (etape === 1 && validerEtape1()) {
      setEtape(2);
    } else if (etape === 2 && validerEtape2()) {
      setEtape(3);
    }
  };

  const precedente = () => {
    if (etape > 1) {
      setEtape(etape - 1);
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle demande de mission</DialogTitle>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center size-8 rounded-full text-sm font-medium ${
                    num === etape
                      ? "bg-primary text-primary-foreground"
                      : num < etape
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {num}
                </div>
                <div className="ml-2 text-sm">
                  {num === 1 && "La mission"}
                  {num === 2 && "Frais estimés"}
                  {num === 3 && "Récapitulatif"}
                </div>
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="mt-6">
          {/* Étape 1 */}
          {etape === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="objet">Objet de la mission *</Label>
                <Textarea
                  id="objet"
                  value={objet}
                  onChange={(e) => setObjet(e.target.value)}
                  placeholder="Décrivez l'objet de la mission..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Ville ou lieu de la mission"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="moyenTransport">Moyen de transport *</Label>
                <Select value={moyenTransport} onValueChange={(v) => setMoyenTransport(v as MoyenTransport)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MOYENS_TRANSPORT).map(([code, label]) => (
                      <SelectItem key={code} value={code}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateDepart">Date de départ *</Label>
                  <Input
                    id="dateDepart"
                    type="date"
                    value={dateDepart}
                    onChange={(e) => setDateDepart(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dateRetour">Date de retour *</Label>
                  <Input
                    id="dateRetour"
                    type="date"
                    value={dateRetour}
                    onChange={(e) => setDateRetour(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Étape 2 */}
          {etape === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Ajoutez les frais estimés pour cette mission
                </p>
                <Button size="sm" variant="outline" onClick={ajouterLigne}>
                  <Plus className="size-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              {lignesFrais.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  Aucun frais estimé. Cliquez sur &quot;Ajouter&quot; pour en ajouter.
                </div>
              ) : (
                <div className="space-y-3">
                  {lignesFrais.map((ligne) => (
                    <div key={ligne.id} className="rounded-md border p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Catégorie</Label>
                          <Select
                            value={ligne.categorie}
                            onValueChange={(v) => modifierLigne(ligne.id, "categorie", v)}
                          >
                            <SelectTrigger className="mt-1 h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(CATEGORIES_FRAIS).map(([code, label]) => (
                                <SelectItem key={code} value={code}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Montant (F CFA)</Label>
                          <Input
                            type="number"
                            value={ligne.montant || ""}
                            onChange={(e) => modifierLigne(ligne.id, "montant", parseInt(e.target.value) || 0)}
                            className="mt-1 h-9"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Libellé</Label>
                          <Input
                            value={ligne.libelle}
                            onChange={(e) => modifierLigne(ligne.id, "libelle", e.target.value)}
                            placeholder="Description de la dépense"
                            className="mt-1 h-9"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => supprimerLigne(ligne.id)}
                          className="mt-auto"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-lg bg-muted p-4 flex items-center justify-between font-medium">
                <span>Total estimé</span>
                <span className="tabular-nums text-lg">{totalFrais.toLocaleString("fr-FR")} F</span>
              </div>

              {totalFrais === 0 && lignesFrais.length > 0 && (
                <p className="text-sm text-amber-600">
                  ⚠️ Avec un total nul, la mission ne passera pas par la Direction Financière
                </p>
              )}
            </div>
          )}

          {/* Étape 3 */}
          {etape === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="font-medium border-b pb-2">Détails de la mission</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Objet :</span>
                    <div className="mt-1">{objet}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Destination :</span>
                    <div className="mt-1">{destination}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Transport :</span>
                    <div className="mt-1">{MOYENS_TRANSPORT[moyenTransport]}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dates :</span>
                    <div className="mt-1">
                      {new Date(dateDepart).toLocaleDateString("fr-FR")} →{" "}
                      {new Date(dateRetour).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="font-medium border-b pb-2">Frais estimés</div>
                {lignesFrais.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun frais estimé</p>
                ) : (
                  <div className="space-y-2">
                    {lignesFrais.map((ligne) => (
                      <div key={ligne.id} className="flex justify-between text-sm">
                        <span>
                          {CATEGORIES_FRAIS[ligne.categorie]} — {ligne.libelle}
                        </span>
                        <span className="tabular-nums font-medium">{ligne.montant.toLocaleString("fr-FR")} F</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total</span>
                      <span className="tabular-nums">{totalFrais.toLocaleString("fr-FR")} F</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-blue-50 p-4 text-sm">
                <div className="font-medium mb-2">Circuit de validation :</div>
                <p className="text-muted-foreground">
                  Votre supérieur hiérarchique visera d'abord. Puis la Direction RH.
                  {totalFrais > 0 && " Si elle valide, la Direction Financière versera l'avance avant votre départ."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div>
            {etape > 1 && (
              <Button variant="ghost" onClick={precedente} disabled={isPending}>
                <ChevronLeft className="size-4 mr-1" />
                Précédent
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { reinitialiser(); onClose(); }} disabled={isPending}>
              Annuler
            </Button>
            {etape < 3 ? (
              <Button onClick={prochaine} disabled={isPending}>
                Suivant
                <ChevronRight className="size-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={soumettreMission} disabled={isPending}>
                {isPending ? "Soumission..." : "Soumettre la demande"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
