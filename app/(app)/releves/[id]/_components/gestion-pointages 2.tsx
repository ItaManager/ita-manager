"use client";

import { useState } from "react";
import {
  ajouterPointage,
  modifierPointage,
  retirerPointage,
  listerEmployesPourPointage,
} from "@/lib/actions/releves";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Employe {
  id: string;
  prenom: string;
  nom: string;
  matricule: string;
  typeMainOeuvre: string;
}

interface Pointage {
  id: string;
  etat: string;
  heuresTheoretiques: number;
  heuresReelles: number;
  heuresSup: number;
  observation: string | null;
  employe: {
    id: string;
    prenom: string;
    nom: string;
    matricule: string;
  };
}

interface GestionPointagesProps {
  releveId: string;
  pointages: Pointage[];
}

const etatConfig: Record<string, { label: string; color: string; bg: string }> = {
  PRESENT: { label: "Présent", color: "#10B981", bg: "#10B98120" },
  ABSENT_JUSTIFIE: { label: "Absent justifié", color: "#F59E0B", bg: "#F59E0B20" },
  ABSENT_NON_JUSTIFIE: { label: "Absent non justifié", color: "#EF4444", bg: "#EF444420" },
  RETARD: { label: "Retard", color: "#F59E0B", bg: "#F59E0B20" },
  REPOS: { label: "Repos", color: "#6B7280", bg: "#6B728020" },
};

export function GestionPointages({ releveId, pointages }: GestionPointagesProps) {
  const [openDialogAjouter, setOpenDialogAjouter] = useState(false);
  const [employesDisponibles, setEmployesDisponibles] = useState<Employe[]>([]);
  const [loadingEmployes, setLoadingEmployes] = useState(false);

  const [employeIdSelectionne, setEmployeIdSelectionne] = useState<string>("");
  const [openCombobox, setOpenCombobox] = useState(false);
  const [loadingAjout, setLoadingAjout] = useState(false);
  const [errorAjout, setErrorAjout] = useState<string | null>(null);

  // Charger les employés disponibles à l'ouverture de la modale
  async function chargerEmployesDisponibles() {
    setLoadingEmployes(true);
    try {
      const employes = await listerEmployesPourPointage(releveId);
      setEmployesDisponibles(employes);
    } catch (error: any) {
      console.error("Erreur lors du chargement des employés:", error);
    } finally {
      setLoadingEmployes(false);
    }
  }

  async function handleAjouterPointage() {
    if (!employeIdSelectionne) {
      setErrorAjout("Veuillez sélectionner un employé");
      return;
    }

    setLoadingAjout(true);
    setErrorAjout(null);

    try {
      await ajouterPointage({
        releveId,
        employeId: employeIdSelectionne,
      });

      setOpenDialogAjouter(false);
      setEmployeIdSelectionne("");
    } catch (error: any) {
      setErrorAjout(error.message || "Une erreur est survenue");
    } finally {
      setLoadingAjout(false);
    }
  }

  async function handleChangerEtat(pointageId: string, nouvelEtat: string) {
    try {
      await modifierPointage({
        pointageId,
        etat: nouvelEtat as any,
      });
    } catch (error: any) {
      console.error("Erreur lors de la modification:", error);
    }
  }

  async function handleRetirerPointage(pointageId: string) {
    if (!confirm("Voulez-vous vraiment retirer ce pointage ?")) {
      return;
    }

    try {
      await retirerPointage(pointageId);
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
    }
  }

  const employeSelectionne = employesDisponibles.find(
    (e) => e.id === employeIdSelectionne
  );

  return (
    <div className="space-y-3">
      {/* Bouton d'ajout */}
      <div className="flex justify-end">
        <Dialog
          open={openDialogAjouter}
          onOpenChange={(open) => {
            setOpenDialogAjouter(open);
            if (open) {
              chargerEmployesDisponibles();
              setEmployeIdSelectionne("");
              setErrorAjout(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="gap-2 bg-[#13850b] hover:bg-[#0f6909]"
            >
              <Plus className="size-4" />
              Ajouter un employé
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un pointage</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {loadingEmployes ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chargement des employés...
                </p>
              ) : employesDisponibles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tous les employés ont déjà été pointés
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Employé</Label>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between rounded-md"
                        >
                          {employeSelectionne ? (
                            <span>
                              <span className="font-medium">
                                {employeSelectionne.prenom} {employeSelectionne.nom}
                              </span>
                              {" — "}
                              <span className="text-muted-foreground">
                                {employeSelectionne.matricule}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Sélectionner un employé...
                            </span>
                          )}
                          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Rechercher un employé..." />
                          <CommandList>
                            <CommandEmpty>Aucun employé trouvé.</CommandEmpty>
                            <CommandGroup>
                              {employesDisponibles.map((employe) => (
                                <CommandItem
                                  key={employe.id}
                                  value={`${employe.prenom} ${employe.nom} ${employe.matricule}`}
                                  onSelect={() => {
                                    setEmployeIdSelectionne(employe.id);
                                    setOpenCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 size-4",
                                      employeIdSelectionne === employe.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div>
                                    <div className="font-medium">
                                      {employe.prenom} {employe.nom}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {employe.matricule} — {employe.typeMainOeuvre}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {errorAjout && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {errorAjout}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setOpenDialogAjouter(false)}
                      disabled={loadingAjout}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleAjouterPointage}
                      disabled={loadingAjout || !employeIdSelectionne}
                      className="bg-[#13850b] hover:bg-[#0f6909]"
                    >
                      {loadingAjout ? "Ajout..." : "Ajouter"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des pointages */}
      <div className="space-y-2">
        {pointages.map((pointage) => {
          const config = etatConfig[pointage.etat];
          return (
            <div
              key={pointage.id}
              className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {pointage.employe.prenom} {pointage.employe.nom}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pointage.employe.matricule}
                </p>
              </div>

              {/* Sélecteur d'état */}
              <Select
                value={pointage.etat}
                onValueChange={(value) =>
                  handleChangerEtat(pointage.id, value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENT">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-3" style={{ color: "#10B981" }} />
                      Présent
                    </div>
                  </SelectItem>
                  <SelectItem value="ABSENT_JUSTIFIE">
                    <div className="flex items-center gap-2">
                      <Clock className="size-3" style={{ color: "#F59E0B" }} />
                      Absent justifié
                    </div>
                  </SelectItem>
                  <SelectItem value="ABSENT_NON_JUSTIFIE">
                    <div className="flex items-center gap-2">
                      <XCircle className="size-3" style={{ color: "#EF4444" }} />
                      Absent non justifié
                    </div>
                  </SelectItem>
                  <SelectItem value="RETARD">
                    <div className="flex items-center gap-2">
                      <Clock className="size-3" style={{ color: "#F59E0B" }} />
                      Retard
                    </div>
                  </SelectItem>
                  <SelectItem value="REPOS">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-3" style={{ color: "#6B7280" }} />
                      Repos
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Heures */}
              <div className="text-xs text-muted-foreground tabular-nums">
                {pointage.heuresReelles}h
                {pointage.heuresSup > 0 && (
                  <span className="ml-1 text-[#13850b]">
                    +{pointage.heuresSup}h
                  </span>
                )}
              </div>

              {/* Bouton supprimer */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRetirerPointage(pointage.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
