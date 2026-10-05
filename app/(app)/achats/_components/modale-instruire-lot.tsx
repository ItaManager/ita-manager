"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComboboxFournisseurs } from "./combobox-fournisseurs";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { instruireLotLignes } from "@/lib/actions/achats";

interface LigneSelectionee {
  id: string;
  designation: string;
  quantite: number;
  unite: string;
}

interface ModaleInstruireLotProps {
  ouvert: boolean;
  onClose: () => void;
  lignes: LigneSelectionee[];
  refDemande: string;
  onSuccess: () => void;
}

export function ModaleInstruireLot({
  ouvert,
  onClose,
  lignes,
  refDemande,
  onSuccess,
}: ModaleInstruireLotProps) {
  const [fournisseurId, setFournisseurId] = useState<string>("");
  const [prix, setPrix] = useState<Record<string, string>>({});
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [enCours, setEnCours] = useState(false);

  const handlePrixChange = (ligneId: string, value: string) => {
    setPrix((prev) => ({ ...prev, [ligneId]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Vérifier les fichiers
    const fichiersValides: File[] = [];
    const typesAcceptes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    for (const file of files) {
      if (!typesAcceptes.includes(file.type)) {
        toast.error(`Type de fichier non accepté : ${file.name}`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Fichier trop volumineux (max 10 MB) : ${file.name}`);
        continue;
      }
      fichiersValides.push(file);
    }

    setFichiers((prev) => [...prev, ...fichiersValides]);
  };

  const retirerFichier = (index: number) => {
    setFichiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!fournisseurId) {
      toast.error("Veuillez sélectionner un fournisseur");
      return;
    }

    if (fichiers.length === 0) {
      toast.error("Veuillez uploader au moins un document");
      return;
    }

    // Vérifier que tous les articles ont un prix
    for (const ligne of lignes) {
      if (!prix[ligne.id] || parseFloat(prix[ligne.id]) <= 0) {
        toast.error(`Veuillez saisir un prix valide pour ${ligne.designation}`);
        return;
      }
    }

    setEnCours(true);
    try {
      // Convertir les fichiers en base64
      const fichiersBase64 = await Promise.all(
        fichiers.map(async (fichier) => {
          return new Promise<{
            name: string;
            type: string;
            size: number;
            base64: string;
          }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: fichier.name,
                type: fichier.type,
                size: fichier.size,
                base64: reader.result as string,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(fichier);
          });
        })
      );

      // Préparer les prix
      const prixArray = lignes.map((ligne) => ({
        ligneId: ligne.id,
        prixUnitaireTTC: parseFloat(prix[ligne.id]),
      }));

      // Appeler la Server Action
      await instruireLotLignes({
        ligneIds: lignes.map((l) => l.id),
        fournisseurId,
        prix: prixArray,
        fichiers: fichiersBase64,
      });

      toast.success(`${lignes.length} article(s) instruit(s) avec succès`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'instruction");
    } finally {
      setEnCours(false);
    }
  };

  // Calculer le total estimé
  const totalEstime = lignes.reduce((sum, ligne) => {
    const prixUnitaire = parseFloat(prix[ligne.id] || "0");
    return sum + prixUnitaire * ligne.quantite;
  }, 0);

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            Instruire {lignes.length} article{lignes.length > 1 ? "s" : ""}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Demande {refDemande}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fournisseur unique */}
          <div className="space-y-2">
            <Label htmlFor="fournisseur">
              Fournisseur <span className="text-destructive">*</span>
            </Label>
            <ComboboxFournisseurs
              value={fournisseurId}
              onChange={setFournisseurId}
            />
            <p className="text-xs text-muted-foreground">
              Le même fournisseur sera appliqué à tous les articles
            </p>
          </div>

          {/* Upload fichiers */}
          <div className="space-y-2">
            <Label htmlFor="devisFichiers">
              Documents <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="devisFichiers"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={handleFileChange}
                className="rounded-md"
                multiple
              />
              <Upload className="size-5 text-muted-foreground shrink-0" />
            </div>

            {/* Liste des fichiers sélectionnés */}
            {fichiers.length > 0 && (
              <div className="space-y-2 mt-3">
                {fichiers.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-muted/30 rounded-md p-2"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        ({(file.size / 1024).toFixed(0)} KB)
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => retirerFichier(index)}
                      className="h-6 w-6 p-0 shrink-0"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Formats acceptés : PDF, Images (JPG, PNG, WebP), Word (DOC, DOCX)
              — Max 10 MB par fichier
            </p>
          </div>

          {/* Tableau des prix par article */}
          <div className="space-y-2">
            <Label>
              Prix unitaire TTC par article{" "}
              <span className="text-destructive">*</span>
            </Label>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Article</th>
                    <th className="text-right p-3 font-medium">Quantité</th>
                    <th className="text-right p-3 font-medium">
                      Prix unitaire TTC
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((ligne, index) => (
                    <tr
                      key={ligne.id}
                      className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                    >
                      <td className="p-3">
                        <div className="font-medium text-foreground">
                          {ligne.designation}
                        </div>
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        {ligne.quantite} {ligne.unite}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0"
                            value={prix[ligne.id] || ""}
                            onChange={(e) =>
                              handlePrixChange(ligne.id, e.target.value)
                            }
                            className="w-32 text-right rounded-md tabular-nums"
                            required
                          />
                          <span className="text-sm text-muted-foreground shrink-0">
                            FCFA
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total estimé */}
          {totalEstime > 0 && (
            <div className="flex items-center justify-between bg-muted/30 rounded-md p-4">
              <span className="font-medium text-foreground">
                Total estimé :
              </span>
              <span className="text-lg font-semibold text-[#1D186C] tabular-nums">
                {totalEstime.toLocaleString("fr-FR")} FCFA
              </span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={enCours}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={enCours}>
              {enCours ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                `Valider l'instruction (${lignes.length} article${lignes.length > 1 ? "s" : ""})`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
