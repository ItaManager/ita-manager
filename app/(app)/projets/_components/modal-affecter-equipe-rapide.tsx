"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { listerEmployes } from "@/lib/actions/employes";
import { modifierTache } from "@/lib/actions/projets";
import { toast } from "sonner";
import { Loader2, Users, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface ModalAffecterEquipeRapideProps {
  tacheId: string;
  tacheLibelle: string;
  projetCode: string;
  projetNom: string;
  employeIdsActuels: string[];
  children: React.ReactNode;
}

export function ModalAffecterEquipeRapide({
  tacheId,
  tacheLibelle,
  projetCode,
  projetNom,
  employeIdsActuels,
  children,
}: ModalAffecterEquipeRapideProps) {
  const [ouvert, setOuvert] = useState(false);
  const [journaliers, setJournaliers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(employeIdsActuels);
  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingJournaliers, setLoadingJournaliers] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (ouvert) {
      chargerJournaliers();
      setSelectedIds(employeIdsActuels);
      setRecherche("");
    }
  }, [ouvert, employeIdsActuels]);

  async function chargerJournaliers() {
    setLoadingJournaliers(true);
    try {
      const data = await listerEmployes();
      const journaliersFiltrés = (data.items || []).filter(
        (emp: any) => emp.typeMainOeuvre === "JOURNALIER"
      );
      setJournaliers(journaliersFiltrés);
    } catch (error) {
      toast.error("Erreur lors du chargement des journaliers");
    } finally {
      setLoadingJournaliers(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await modifierTache(tacheId, {
        employeIds: selectedIds,
      });
      toast.success(
        `${selectedIds.length} journalier(s) affecté(s) à la tâche`
      );
      setOuvert(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'affectation");
    } finally {
      setLoading(false);
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
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <div onClick={() => setOuvert(true)}>{children}</div>

      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl p-0">
        <DialogHeader className="bg-primary-soft p-6 rounded-t-lg">
          <DialogTitle className="text-xl font-semibold text-primary flex items-center gap-2">
            <Users className="size-5" />
            Composer l'équipe rapidement
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {projetCode} · {projetNom} · {tacheLibelle}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Recherche */}
          <div className="space-y-2">
            <Label htmlFor="recherche">Rechercher un journalier</Label>
            <Input
              id="recherche"
              placeholder="Nom, prénom ou matricule..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Actions rapides */}
          <div className="flex items-center justify-between pb-2 border-b">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleTous}
              disabled={loadingJournaliers || journaliersFiltres.length === 0}
              className="h-9"
            >
              {selectedIds.length === journaliersFiltres.length
                ? "Tout désélectionner"
                : "Tout sélectionner"}
            </Button>
            <span className="text-sm font-medium text-primary">
              {selectedIds.length} sélectionné(s)
            </span>
          </div>

          {/* Liste des journaliers */}
          <div className="space-y-2">
            <Label>Journaliers disponibles</Label>
            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
              {loadingJournaliers ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Loader2 className="size-6 animate-spin mx-auto mb-2" />
                  Chargement des journaliers...
                </div>
              ) : journaliersFiltres.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  Aucun journalier trouvé
                </div>
              ) : (
                <div className="divide-y">
                  {journaliersFiltres.map((journalier) => {
                    const estSelectionne = selectedIds.includes(journalier.id);
                    const dejaAffecte = employeIdsActuels.includes(journalier.id);

                    return (
                      <label
                        key={journalier.id}
                        className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={estSelectionne}
                          onCheckedChange={() => toggleEmploye(journalier.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium flex items-center gap-2">
                            {journalier.prenom} {journalier.nom}
                            {dejaAffecte && (
                              <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                <Check className="size-3" />
                                Déjà affecté
                              </span>
                            )}
                          </div>
                          {journalier.matricule && (
                            <div className="text-sm text-muted-foreground">
                              Matricule : {journalier.matricule}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOuvert(false)}
              disabled={loading}
              className="rounded-full h-11 px-6"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-full h-11 px-6 bg-primary hover:bg-primary-hover"
            >
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Affecter {selectedIds.length} journalier(s)
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
