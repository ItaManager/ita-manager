"use client";

import { useState } from "react";
import { modifierPointage } from "@/lib/actions/releves";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, AlertCircle, Users, Wrench, Truck, AlertTriangle } from "lucide-react";

interface Employe {
  id: string;
  prenom: string;
  nom: string;
  matricule: string;
}

interface Pointage {
  id: string;
  etat: string;
  motifAbsence: string | null;
  heuresTheoretiques: number;
  heuresReelles: number;
  heuresSup: number;
  observation: string | null;
  employe: Employe;
}

interface PointagesSimplifiedProps {
  releveId: string;
  pointages: Pointage[];
  nbPresents: number;
  totalHeures: number;
}

const motifsAbsence = [
  { value: "MALADIE", label: "Maladie" },
  { value: "PERMISSION", label: "Permission" },
  { value: "INTEMPERIE", label: "Intempérie" },
  { value: "ABSENT_SANS_MOTIF", label: "Absent sans motif" },
  { value: "AUTRE", label: "Autre" },
];

export function PointagesSimplifies({
  releveId,
  pointages,
  nbPresents,
  totalHeures,
}: PointagesSimplifiedProps) {
  const [openAbsentDialog, setOpenAbsentDialog] = useState(false);
  const [employeSelectionne, setEmployeSelectionne] = useState<Pointage | null>(null);
  const [motifSelectionne, setMotifSelectionne] = useState<string>("MALADIE");
  const [loading, setLoading] = useState(false);

  const [openHeuresDialog, setOpenHeuresDialog] = useState(false);
  const [employeHeures, setEmployeHeures] = useState<Pointage | null>(null);
  const [heuresReelles, setHeuresReelles] = useState<number>(8);
  const [heuresSup, setHeuresSup] = useState<number>(0);
  const [loadingHeures, setLoadingHeures] = useState(false);

  function ouvrirDialogAbsence(pointage: Pointage) {
    setEmployeSelectionne(pointage);
    setMotifSelectionne("MALADIE");
    setOpenAbsentDialog(true);
  }

  async function confirmerAbsence() {
    if (!employeSelectionne) return;

    setLoading(true);
    try {
      const etat = motifSelectionne === "ABSENT_SANS_MOTIF" ? "ABSENT_NON_JUSTIFIE" : "ABSENT_JUSTIFIE";

      await modifierPointage({
        pointageId: employeSelectionne.id,
        etat: etat as any,
        motifAbsence: motifSelectionne as any,
        heuresReelles: 0,
        heuresSup: 0,
      });

      setOpenAbsentDialog(false);
      setEmployeSelectionne(null);
    } catch (error: any) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }

  async function marquerPresent(pointage: Pointage) {
    try {
      await modifierPointage({
        pointageId: pointage.id,
        etat: "PRESENT",
        motifAbsence: null,
        heuresReelles: pointage.heuresTheoretiques,
        heuresSup: 0,
      });
    } catch (error: any) {
      console.error("Erreur:", error);
    }
  }

  function ouvrirDialogHeures(pointage: Pointage) {
    setEmployeHeures(pointage);
    setHeuresReelles(pointage.heuresReelles);
    setHeuresSup(pointage.heuresSup);
    setOpenHeuresDialog(true);
  }

  async function confirmerHeures() {
    if (!employeHeures) return;

    setLoadingHeures(true);
    try {
      await modifierPointage({
        pointageId: employeHeures.id,
        heuresReelles: heuresReelles,
        heuresSup: heuresSup,
      });

      setOpenHeuresDialog(false);
      setEmployeHeures(null);
    } catch (error: any) {
      console.error("Erreur:", error);
    } finally {
      setLoadingHeures(false);
    }
  }

  // Calculer taux journalier moyen (à améliorer avec vraies données)
  const tauxMoyenJournalier = 7000; // Exemple
  const montantEstime = nbPresents * tauxMoyenJournalier;

  return (
    <Tabs defaultValue="presences" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="presences" className="gap-2">
          <Users className="size-4" />
          Présences
        </TabsTrigger>
        <TabsTrigger value="travaux" className="gap-2">
          <Wrench className="size-4" />
          Travaux
        </TabsTrigger>
        <TabsTrigger value="engins" className="gap-2">
          <Truck className="size-4" />
          Engins
        </TabsTrigger>
        <TabsTrigger value="incidents" className="gap-2">
          <AlertTriangle className="size-4" />
          Incidents
        </TabsTrigger>
      </TabsList>

      <TabsContent value="presences" className="space-y-6">
        {/* Message de guidance */}
        {nbPresents === pointages.length && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  Les {pointages.length} agents sont présents, {8} heures chacun
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Ne touchez à rien si la journée s'est déroulée normalement. Signalez seulement les absences et les écarts d'horaire.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Liste des employés */}
      <div className="space-y-2">
        {pointages.map((pointage) => {
          const estPresent = pointage.etat === "PRESENT";

          return (
            <div
              key={pointage.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-medium">
                    {pointage.employe.prenom} {pointage.employe.nom}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {pointage.employe.matricule}
                  </Badge>
                </div>
                {!estPresent && pointage.motifAbsence && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {motifsAbsence.find(m => m.value === pointage.motifAbsence)?.label}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {estPresent ? (
                  <>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {pointage.heuresReelles}h
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => ouvrirDialogAbsence(pointage)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Absent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => ouvrirDialogHeures(pointage)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      Autres heures
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => marquerPresent(pointage)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle2 className="size-4 mr-2" />
                    Remettre présent
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Résumé */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          <p className="text-sm text-muted-foreground">
            {nbPresents} présents · {totalHeures} heures · 0 saisie
          </p>
          <p className="text-2xl font-semibold tabular-nums mt-1">
            {montantEstime.toLocaleString()} F
            <span className="text-sm font-normal text-muted-foreground ml-2">
              dû aux journaliers
            </span>
          </p>
        </div>

        <Button
          size="lg"
          className="gap-2 bg-[#13850b] hover:bg-[#0f6909]"
          disabled
        >
          Soumettre le relevé
        </Button>
      </div>
      </TabsContent>

      <TabsContent value="travaux" className="space-y-4">
        <div className="text-center py-12 text-muted-foreground">
          <Wrench className="size-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Saisie des travaux réalisés — à venir</p>
        </div>
      </TabsContent>

      <TabsContent value="engins" className="space-y-4">
        <div className="text-center py-12 text-muted-foreground">
          <Truck className="size-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Saisie des engins utilisés — à venir</p>
        </div>
      </TabsContent>

      <TabsContent value="incidents" className="space-y-4">
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="size-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Déclaration des incidents — à venir</p>
        </div>
      </TabsContent>

      {/* Dialog Marquer absent */}
      <Dialog open={openAbsentDialog} onOpenChange={setOpenAbsentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Marquer absent</DialogTitle>
          </DialogHeader>

          {employeSelectionne && (
            <div className="space-y-6">
              <p className="font-medium">
                {employeSelectionne.employe.prenom} {employeSelectionne.employe.nom}
              </p>

              <div className="space-y-3">
                <Label>Motif</Label>
                <RadioGroup value={motifSelectionne} onValueChange={setMotifSelectionne}>
                  {motifsAbsence.map((motif) => (
                    <div
                      key={motif.value}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer ${
                        motifSelectionne === motif.value
                          ? "border-red-500 bg-red-50"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => setMotifSelectionne(motif.value)}
                    >
                      <RadioGroupItem value={motif.value} id={motif.value} />
                      <Label
                        htmlFor={motif.value}
                        className="flex-1 cursor-pointer"
                      >
                        {motif.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-4 text-orange-600 mt-0.5" />
                  <p className="text-sm text-orange-800">
                    <span className="font-medium">Journalier</span> — un jour non pointé est un jour non payé.{" "}
                    <span className="font-medium">7 500 F</span> ne seront pas dus.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setOpenAbsentDialog(false)}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmerAbsence}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? "Confirmation..." : "Confirmer l'absence"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier heures */}
      <Dialog open={openHeuresDialog} onOpenChange={setOpenHeuresDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les heures</DialogTitle>
          </DialogHeader>

          {employeHeures && (
            <div className="space-y-6">
              <p className="font-medium">
                {employeHeures.employe.prenom} {employeHeures.employe.nom}
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="heuresReelles">Heures réelles</Label>
                  <Input
                    id="heuresReelles"
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={heuresReelles}
                    onChange={(e) => setHeuresReelles(parseFloat(e.target.value) || 0)}
                    className="rounded-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    Heures normales travaillées (0 à 24h)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heuresSup">Heures supplémentaires</Label>
                  <Input
                    id="heuresSup"
                    type="number"
                    min="0"
                    max="12"
                    step="0.5"
                    value={heuresSup}
                    onChange={(e) => setHeuresSup(parseFloat(e.target.value) || 0)}
                    className="rounded-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    Heures supplémentaires (majorées)
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm text-blue-800">
                  Total : <span className="font-medium tabular-nums">{heuresReelles + heuresSup}h</span>
                  {heuresSup > 0 && (
                    <span className="ml-2 text-xs">
                      ({heuresReelles}h + {heuresSup}h sup)
                    </span>
                  )}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setOpenHeuresDialog(false)}
                  disabled={loadingHeures}
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmerHeures}
                  disabled={loadingHeures}
                  className="bg-[#13850b] hover:bg-[#0f6909]"
                >
                  {loadingHeures ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
