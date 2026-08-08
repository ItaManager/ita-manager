"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { obtenirEmploye } from "@/lib/actions/employes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ModaleProfilJournalierProps {
  ouvert: boolean;
  onClose: () => void;
  employeId: string;
  employeNom: string;
  employePrenom: string;
}

interface EmployeDetail {
  nom: string;
  prenom: string;
  matricule: string;
  sexe?: string | null;
  dateNaissance?: Date | null;
  lieuNaissance?: string | null;
  telephone: string;
  numeroWave?: string | null;
  competenceActuelle?: string | null;
  tauxActuel?: number | null;
  archiveLe?: Date | null;
  creeLe: Date;
}

export function ModaleProfilJournalier({
  ouvert,
  onClose,
  employeId,
  employeNom,
  employePrenom,
}: ModaleProfilJournalierProps) {
  const [employe, setEmploye] = useState<EmployeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (ouvert && employeId) {
      setIsLoading(true);
      obtenirEmploye(employeId)
        .then((data) => {
          if (data) {
            setEmploye(data as any);
          }
        })
        .catch(() => {
          setEmploye(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [ouvert, employeId]);

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader
          className="border-b border-border px-6 py-4"
          style={{ backgroundColor: "#ebeaf2" }}
        >
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            Profil du journalier
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {employeNom} {employePrenom}
          </p>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : employe ? (
            <>
              {/* Identité */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#1D186C]">Identité</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Matricule</p>
                    <p className="text-sm font-mono font-medium">{employe.matricule}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sexe</p>
                    <p className="text-sm">{employe.sexe || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date de naissance</p>
                    <p className="text-sm">
                      {employe.dateNaissance
                        ? format(new Date(employe.dateNaissance), "dd/MM/yyyy", { locale: fr })
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lieu de naissance</p>
                    <p className="text-sm">{employe.lieuNaissance || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Contact et paiement */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#1D186C]">Contact et paiement</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="text-sm font-mono">{employe.telephone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Numéro Wave</p>
                    <p className="text-sm font-mono">{employe.numeroWave || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Compétence et taux */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#1D186C]">Compétence et rémunération</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Compétence actuelle</p>
                    <div className="mt-1">
                      {employe.competenceActuelle ? (
                        <Badge variant="secondary">{employe.competenceActuelle}</Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700">
                          Non assignée
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Taux journalier</p>
                    <p className="text-sm font-mono font-medium">
                      {employe.tauxActuel
                        ? `${employe.tauxActuel.toLocaleString()} FCFA/j`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statut */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#1D186C]">Statut</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">État du profil</p>
                    <div className="mt-1">
                      <Badge variant="secondary">
                        {employe.archiveLe ? "Archivé" : "Actif"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Créé le</p>
                    <p className="text-sm">
                      {format(new Date(employe.creeLe), "dd/MM/yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Impossible de charger les informations du journalier.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-end">
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
