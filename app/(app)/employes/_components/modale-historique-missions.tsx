"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ModaleHistoriqueMissionsProps {
  ouvert: boolean;
  onClose: () => void;
  employeId: string;
  employeNom: string;
  employePrenom: string;
}

interface Mission {
  id: string;
  projet: {
    nom: string;
    code: string;
  };
  dateDebut: Date;
  dateFin: Date | null;
  roleFonctionnel: string;
  estActive: boolean;
}

export function ModaleHistoriqueMissions({
  ouvert,
  onClose,
  employeId,
  employeNom,
  employePrenom,
}: ModaleHistoriqueMissionsProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (ouvert && employeId) {
      setIsLoading(true);
      // TODO: Créer une action pour récupérer l'historique des missions
      // Pour l'instant, on simule avec un tableau vide
      setTimeout(() => {
        setMissions([]);
        setIsLoading(false);
      }, 500);
    }
  }, [ouvert, employeId]);

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader
          className="border-b border-border px-6 py-4"
          style={{ backgroundColor: "#ebeaf2" }}
        >
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            Historique des missions
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {employeNom} {employePrenom}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          {/* Timeline des missions */}
          <div className="space-y-4 relative max-h-[60vh] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : missions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune mission pour ce journalier.
              </p>
            ) : (
              <>
                {missions.map((mission, index) => (
                  <div key={mission.id} className="flex gap-4">
                    {/* Indicateur */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`size-3 rounded-full ${
                          mission.estActive ? "bg-[#13850b]" : "bg-gray-400"
                        }`}
                      />
                      {index < missions.length - 1 && (
                        <div className="w-0.5 h-full bg-border mt-2" />
                      )}
                    </div>

                    {/* Carte mission */}
                    <div
                      className={`flex-1 rounded-lg border-2 p-4 ${
                        mission.estActive
                          ? "border-[#13850b] bg-green-50"
                          : "border-border bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-lg font-semibold text-[#1D186C]">
                            {mission.projet.nom}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {mission.projet.code}
                          </div>
                        </div>
                        <Badge
                          variant={mission.estActive ? "default" : "secondary"}
                          className={
                            mission.estActive
                              ? "bg-[#13850b] hover:bg-[#13850b]"
                              : ""
                          }
                        >
                          {mission.estActive ? "en cours" : "terminée"}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          <span className="font-medium">Rôle :</span>{" "}
                          {mission.roleFonctionnel}
                        </p>
                        <p>
                          <span className="font-medium">Début :</span>{" "}
                          {format(new Date(mission.dateDebut), "dd/MM/yyyy", {
                            locale: fr,
                          })}
                        </p>
                        {mission.dateFin && (
                          <p>
                            <span className="font-medium">Fin :</span>{" "}
                            {format(new Date(mission.dateFin), "dd/MM/yyyy", {
                              locale: fr,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Message informatif */}
          {missions.length === 0 && !isLoading && (
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <AlertCircle className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Les affectations aux chantiers sont gérées par la Direction
                Technique. Contactez la DT pour affecter ce journalier à un
                projet.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {missions.length} mission{missions.length > 1 ? "s" : ""}
          </span>
          <Button
            onClick={onClose}
            className="bg-[#1D186C] hover:bg-[#171356] text-white rounded-full px-6"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
