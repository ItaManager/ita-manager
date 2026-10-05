"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  listerCriteres,
  creerCritere,
  validerInstructionAvecCriteres,
} from "@/lib/actions/achats";

interface LigneAvecFournisseurs {
  id: string;
  designation: string;
  quantite: number;
  unite: string;
  fournisseurs: Array<{
    id: string;
    nom: string;
    prixUnitaire: number;
  }>;
}

interface ModaleValiderInstructionProps {
  ouvert: boolean;
  onClose: () => void;
  demande: {
    id: string;
    ref: string;
    lignes: LigneAvecFournisseurs[];
  };
  onSuccess: () => void;
}

export function ModaleValiderInstruction({
  ouvert,
  onClose,
  demande,
  onSuccess,
}: ModaleValiderInstructionProps) {
  const [criteres, setCriteres] = useState<any[]>([]);
  const [criteresSelectionnes, setCriteresSelectionnes] = useState<string[]>([]);
  const [selectionsLignes, setSelectionsLignes] = useState<Record<string, string>>({});
  const [commentaire, setCommentaire] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [nouveauCritere, setNouveauCritere] = useState("");
  const [ajoutEnCours, setAjoutEnCours] = useState(false);

  useEffect(() => {
    if (ouvert) {
      chargerCriteres();
    }
  }, [ouvert]);

  const chargerCriteres = async () => {
    try {
      const data = await listerCriteres();
      setCriteres(data);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des critères");
    } finally {
      setChargement(false);
    }
  };

  const ajouterCritere = async () => {
    if (!nouveauCritere.trim()) {
      toast.error("Veuillez saisir un libellé");
      return;
    }

    setAjoutEnCours(true);
    try {
      const nouveauCrit = await creerCritere({ libelle: nouveauCritere.trim() });
      setCriteres((prev) => [...prev, nouveauCrit]);
      setCriteresSelectionnes((prev) => [...prev, nouveauCrit.id]);
      setNouveauCritere("");
      toast.success("Critère créé et sélectionné");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création du critère");
    } finally {
      setAjoutEnCours(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (criteresSelectionnes.length === 0) {
      toast.error("Veuillez sélectionner au moins un critère");
      return;
    }

    // Vérifier que chaque ligne a un fournisseur sélectionné
    for (const ligne of demande.lignes) {
      if (!selectionsLignes[ligne.id]) {
        toast.error(`Veuillez sélectionner un fournisseur pour ${ligne.designation}`);
        return;
      }
    }

    setEnCours(true);
    try {
      const selections = Object.entries(selectionsLignes).map(([ligneId, fournisseurId]) => ({
        ligneId,
        fournisseurRetenu: fournisseurId,
      }));

      await validerInstructionAvecCriteres({
        demandeId: demande.id,
        selections,
        criteresIds: criteresSelectionnes,
        commentaire: commentaire || undefined,
      });

      toast.success("Instruction validée avec succès");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la validation");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader
          className="border-b border-border px-6 py-4 sticky top-0 bg-white z-10"
          style={{ backgroundColor: "var(--primary-soft)" }}
        >
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            Valider l'instruction — {demande.ref}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Sélectionnez le fournisseur retenu pour chaque article
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          {/* Sélection des fournisseurs par article */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Fournisseurs retenus <span className="text-destructive">*</span>
            </Label>
            {demande.lignes.map((ligne) => (
              <div key={ligne.id} className="bg-white rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="font-medium text-foreground">
                    {ligne.designation} ({ligne.quantite} {ligne.unite})
                  </div>
                  {selectionsLignes[ligne.id] && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectionsLignes((prev) => {
                          const newSelections = { ...prev };
                          delete newSelections[ligne.id];
                          return newSelections;
                        });
                      }}
                      className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    >
                      Retirer sélection
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {ligne.fournisseurs.map((f) => (
                    <label
                      key={f.id}
                      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                        selectionsLignes[ligne.id] === f.id
                          ? "bg-primary/5 border-2 border-primary"
                          : "border-2 border-border hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`fournisseur_${ligne.id}`}
                        value={f.id}
                        checked={selectionsLignes[ligne.id] === f.id}
                        onChange={() =>
                          setSelectionsLignes((prev) => ({ ...prev, [ligne.id]: f.id }))
                        }
                        className="size-4"
                      />
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm font-medium">{f.nom}</span>
                        <span className="text-sm font-medium tabular-nums text-[#1D186C]">
                          {f.prixUnitaire.toLocaleString("fr-FR")} FCFA
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Critères de sélection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Critères de sélection <span className="text-destructive">*</span>
            </Label>
            {chargement ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="bg-white rounded-xl border-2 border-border p-4">
                <div className="space-y-2">
                  {criteres.map((critere) => (
                    <label
                      key={critere.id}
                      className={`flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                        criteresSelectionnes.includes(critere.id)
                          ? "bg-primary/5"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <Checkbox
                        checked={criteresSelectionnes.includes(critere.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCriteresSelectionnes((prev) => [...prev, critere.id]);
                          } else {
                            setCriteresSelectionnes((prev) =>
                              prev.filter((id) => id !== critere.id)
                            );
                          }
                        }}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{critere.libelle}</div>
                        {critere.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {critere.description}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Ajouter un critère personnalisé */}
                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-border">
                  <Input
                    placeholder="Ajouter un critère personnalisé..."
                    value={nouveauCritere}
                    onChange={(e) => setNouveauCritere(e.target.value)}
                    className="rounded-md"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        ajouterCritere();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={ajouterCritere}
                    disabled={ajoutEnCours || !nouveauCritere.trim()}
                    className="shrink-0"
                  >
                    {ajoutEnCours ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="size-4 mr-1" />
                        Ajouter
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Commentaire optionnel */}
          <div className="space-y-2">
            <Label htmlFor="commentaire" className="text-base font-medium">
              Commentaire (optionnel)
            </Label>
            <Textarea
              id="commentaire"
              placeholder="Justification de la sélection des fournisseurs et critères..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              className="rounded-md resize-none min-h-[100px] border-2 border-border"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Ce commentaire sera enregistré dans l'historique de la demande
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={enCours}
              className="rounded-full"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={enCours}
              className="rounded-full bg-[#22c55e] hover:bg-[#16a34a] text-white"
            >
              {enCours ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Validation...
                </>
              ) : (
                "Valider l'instruction complète"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
