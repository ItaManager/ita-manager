"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { creerDemandeRessource } from "@/lib/actions/projets";
import { toast } from "sonner";

interface ModalDemandeRessourceProps {
  projetId: string;
  ouvert: boolean;
  taches: Array<{ id: string; libelle: string }>;
  materiels: Array<{ id: string; codeIta: string; designation: string; type: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

interface LigneDemande {
  materielId: string;
  operateurRequis: boolean;
  commentaire: string;
}

export function ModalDemandeRessource({
  projetId,
  ouvert,
  taches,
  materiels,
  onClose,
  onSuccess,
}: ModalDemandeRessourceProps) {
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [motif, setMotif] = useState("");
  const [lieuLivraison, setLieuLivraison] = useState("");
  const [tachesSelectionnees, setTachesSelectionnees] = useState<string[]>([]);
  const [lignes, setLignes] = useState<LigneDemande[]>([
    { materielId: "", operateurRequis: false, commentaire: "" },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ouvert) {
      // Reset form
      setDateDebut("");
      setDateFin("");
      setMotif("");
      setLieuLivraison("");
      setTachesSelectionnees([]);
      setLignes([{ materielId: "", operateurRequis: false, commentaire: "" }]);
    }
  }, [ouvert]);

  const ajouterLigne = () => {
    setLignes([...lignes, { materielId: "", operateurRequis: false, commentaire: "" }]);
  };

  const supprimerLigne = (index: number) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((_, i) => i !== index));
    }
  };

  const modifierLigne = (index: number, champ: keyof LigneDemande, valeur: any) => {
    const nouvellesLignes = [...lignes];
    nouvellesLignes[index] = { ...nouvellesLignes[index], [champ]: valeur };
    setLignes(nouvellesLignes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!dateDebut || !dateFin) {
      toast.error("Les dates de début et de fin sont obligatoires");
      return;
    }

    if (new Date(dateDebut) > new Date(dateFin)) {
      toast.error("La date de fin doit être postérieure à la date de début");
      return;
    }

    if (!motif.trim()) {
      toast.error("Le motif est obligatoire");
      return;
    }

    const lignesValides = lignes.filter((l) => l.materielId);
    if (lignesValides.length === 0) {
      toast.error("Veuillez sélectionner au moins un matériel");
      return;
    }

    setLoading(true);

    try {
      await creerDemandeRessource({
        projetId,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        motif: motif.trim(),
        lieuLivraison: lieuLivraison.trim() || undefined,
        tacheIds: tachesSelectionnees.length > 0 ? tachesSelectionnees : undefined,
        lignes: lignesValides,
      });

      toast.success("Demande de ressource créée avec succès");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle demande de ressource</DialogTitle>
          <DialogDescription>
            Demander du matériel ou des engins pour ce projet
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Période */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">
                Date de début <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFin">
                Date de fin <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateFin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="rounded-md"
              />
            </div>
          </div>

          {/* Motif */}
          <div className="space-y-2">
            <Label htmlFor="motif">
              Motif / Justification <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Pourquoi cette ressource est-elle nécessaire ?"
              rows={3}
              className="rounded-md resize-none"
            />
          </div>

          {/* Lieu de livraison */}
          <div className="space-y-2">
            <Label htmlFor="lieuLivraison">Lieu de livraison (optionnel)</Label>
            <Input
              id="lieuLivraison"
              value={lieuLivraison}
              onChange={(e) => setLieuLivraison(e.target.value)}
              placeholder="Ex: Chantier Zone A, Base vie, etc."
              className="rounded-md"
            />
          </div>

          {/* Tâches concernées */}
          {taches.length > 0 && (
            <div className="space-y-2">
              <Label>Tâches concernées (optionnel)</Label>
              <div className="border rounded-md p-4 max-h-40 overflow-y-auto space-y-2">
                {taches.map((tache) => (
                  <div key={tache.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`tache-${tache.id}`}
                      checked={tachesSelectionnees.includes(tache.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTachesSelectionnees([...tachesSelectionnees, tache.id]);
                        } else {
                          setTachesSelectionnees(tachesSelectionnees.filter((id) => id !== tache.id));
                        }
                      }}
                    />
                    <label
                      htmlFor={`tache-${tache.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {tache.libelle}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matériels demandés */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Matériels demandés <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={ajouterLigne}
                className="rounded-full"
              >
                <Plus className="size-4 mr-1" />
                Ajouter un matériel
              </Button>
            </div>

            <div className="space-y-3">
              {lignes.map((ligne, index) => (
                <div key={index} className="border rounded-md p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {/* Sélecteur de matériel */}
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`materiel-${index}`}>Matériel</Label>
                      <select
                        id={`materiel-${index}`}
                        value={ligne.materielId}
                        onChange={(e) => modifierLigne(index, "materielId", e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">-- Sélectionner un matériel --</option>
                        {materiels.map((mat) => (
                          <option key={mat.id} value={mat.id}>
                            {mat.codeIta} — {mat.designation} ({mat.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bouton supprimer */}
                    {lignes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => supprimerLigne(index)}
                        className="mt-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>

                  {/* Opérateur requis */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`operateur-${index}`}
                      checked={ligne.operateurRequis}
                      onCheckedChange={(checked) =>
                        modifierLigne(index, "operateurRequis", checked)
                      }
                    />
                    <label htmlFor={`operateur-${index}`} className="text-sm cursor-pointer">
                      Opérateur requis
                    </label>
                  </div>

                  {/* Commentaire */}
                  <div className="space-y-2">
                    <Label htmlFor={`commentaire-${index}`}>Commentaire (optionnel)</Label>
                    <Input
                      id={`commentaire-${index}`}
                      value={ligne.commentaire}
                      onChange={(e) => modifierLigne(index, "commentaire", e.target.value)}
                      placeholder="Précisions sur l'utilisation..."
                      className="rounded-md"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-full"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#13850b] hover:bg-[#0f6909] text-white"
            >
              {loading ? "Création..." : "Créer la demande"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
