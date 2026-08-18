"use client";

import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { listerEmployes } from "@/lib/actions/employes";
import { modifierTache } from "@/lib/actions/projets";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";

interface ModalAffecterEquipeRapideProps {
  tacheId: string;
  tacheLibelle: string;
  employeIdsActuels: string[];
  ouvert: boolean;
  onFermer: () => void;
  onSuccess: () => void;
}

export function ModalAffecterEquipeRapide({
  tacheId,
  tacheLibelle,
  employeIdsActuels,
  ouvert,
  onFermer,
  onSuccess,
}: ModalAffecterEquipeRapideProps) {
  const [journaliers, setJournaliers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(employeIdsActuels);
  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(false);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (ouvert) {
      chargerJournaliers();
      setSelectedIds(employeIdsActuels);
    }
  }, [ouvert, employeIdsActuels]);

  async function chargerJournaliers() {
    setLoading(true);
    try {
      const data = await listerEmployes();
      const journaliersFiltrés = (data.items || []).filter(
        (emp: any) => emp.typeMainOeuvre === "JOURNALIER"
      );
      setJournaliers(journaliersFiltrés);
    } catch (error) {
      toast.error("Erreur lors du chargement des journaliers");
    } finally {
      setLoading(false);
    }
  }

  function toggleEmploye(employeId: string) {
    setSelectedIds((prev) =>
      prev.includes(employeId)
        ? prev.filter((id) => id !== employeId)
        : [...prev, employeId]
    );
  }

  function toggleTous() {
    if (selectedIds.length === journaliersFiltres.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(journaliersFiltres.map((j) => j.id));
    }
  }

  async function handleSubmit() {
    setChargement(true);
    try {
      await modifierTache(tacheId, {
        employeIds: selectedIds,
      });
      toast.success(
        `${selectedIds.length} journalier(s) affecté(s) à la tâche`
      );
      onSuccess();
      onFermer();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'affectation");
    } finally {
      setChargement(false);
    }
  }

  const journaliersFiltres = journaliers.filter((j) => {
    if (!recherche) return true;
    const term = recherche.toLowerCase();
    return (
      j.nom.toLowerCase().includes(term) ||
      j.prenom.toLowerCase().includes(term) ||
      j.matricule?.toLowerCase().includes(term)
    );
  });

  return (
    <Dialog open={ouvert} onOpenChange={onFermer}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Composer l'équipe rapidement
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les journaliers à affecter à la tâche :{" "}
            <span className="font-medium text-foreground">{tacheLibelle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recherche */}
          <Input
            placeholder="Rechercher un journalier (nom, prénom, matricule)..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="h-11"
          />

          {/* Actions rapides */}
          <div className="flex items-center justify-between text-sm">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleTous}
              disabled={loading || journaliersFiltres.length === 0}
            >
              {selectedIds.length === journaliersFiltres.length
                ? "Tout désélectionner"
                : "Tout sélectionner"}
            </Button>
            <span className="text-muted-foreground">
              {selectedIds.length} sélectionné(s)
            </span>
          </div>

          {/* Liste des journaliers */}
          <div className="border rounded-lg max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">
                <Loader2 className="size-6 animate-spin mx-auto mb-2" />
                Chargement...
              </div>
            ) : journaliersFiltres.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                Aucun journalier trouvé
              </div>
            ) : (
              <div className="divide-y">
                {journaliersFiltres.map((journalier) => (
                  <label
                    key={journalier.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedIds.includes(journalier.id)}
                      onCheckedChange={() => toggleEmploye(journalier.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {journalier.prenom} {journalier.nom}
                      </div>
                      {journalier.matricule && (
                        <div className="text-sm text-muted-foreground">
                          Mat. {journalier.matricule}
                        </div>
                      )}
                    </div>
                    {employeIdsActuels.includes(journalier.id) && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Déjà affecté
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onFermer}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={chargement}>
            {chargement && <Loader2 className="size-4 mr-2 animate-spin" />}
            Affecter {selectedIds.length} journalier(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
