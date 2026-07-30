"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listerDemandesRH } from "@/lib/actions/conges";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, X } from "lucide-react";
import { ModalDecisionRH } from "./modal-decision-rh";
import type { Decimal } from "@prisma/client/runtime/library";

type DemandeItem = {
  id: string;
  employe: {
    matricule: string;
    nom: string;
    prenom: string;
  };
  typeAbsence: string;
  dateDebut: Date;
  dateFin: Date;
  nombreJours: Decimal;
  motif: string | null;
  soumieLe: Date;
  decisionN1Le: Date;
  decompte: boolean;
};

export function ListeDemandesRH() {
  const [demandes, setDemandes] = useState<DemandeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [demandeSelectionnee, setDemandeSelectionnee] = useState<DemandeItem | null>(null);

  useEffect(() => {
    chargerDemandes();
  }, []);

  async function chargerDemandes() {
    setLoading(true);
    try {
      const data = await listerDemandesRH();
      setDemandes(data);
    } catch (error) {
      console.error("Erreur chargement demandes:", error);
    } finally {
      setLoading(false);
    }
  }

  function ouvrirModal(demande: DemandeItem) {
    setDemandeSelectionnee(demande);
    setModalOuverte(true);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>À contrôler</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chargement...
            </p>
          ) : demandes.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune demande en attente de contrôle
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Les demandes validées par les supérieurs apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {demandes.map((demande) => (
                <div
                  key={demande.id}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">
                        {demande.employe.prenom} {demande.employe.nom}
                      </p>
                      <Badge variant="secondary">{demande.employe.matricule}</Badge>
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">
                          {demande.typeAbsence}
                        </span>
                        {demande.decompte && (
                          <span className="ml-2 text-xs">
                            · Décompté du solde
                          </span>
                        )}
                      </p>
                      <p>
                        Du{" "}
                        {format(new Date(demande.dateDebut), "d MMMM yyyy", {
                          locale: fr,
                        })}{" "}
                        au{" "}
                        {format(new Date(demande.dateFin), "d MMMM yyyy", {
                          locale: fr,
                        })}{" "}
                        · {demande.nombreJours.toString()} jour
                        {Number(demande.nombreJours) > 1 ? "s" : ""}
                      </p>
                      {demande.motif && (
                        <p className="italic">Motif : {demande.motif}</p>
                      )}
                      <p className="text-xs">
                        Validée N+1 le{" "}
                        {format(new Date(demande.decisionN1Le), "d MMM à HH:mm", {
                          locale: fr,
                        })}
                      </p>

                      {/* Phase 6 : Afficher le solde disponible et le solde après */}
                      {demande.decompte && (
                        <div className="mt-2 rounded-md border border-warning-border bg-warning-soft p-2">
                          <p className="text-xs text-warning">
                            ⚠️ Calcul du solde : Phase 6
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => ouvrirModal(demande)}
                      className="rounded-full"
                    >
                      Traiter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {demandeSelectionnee && (
        <ModalDecisionRH
          ouvert={modalOuverte}
          onOuvertChange={setModalOuverte}
          demande={demandeSelectionnee}
          onSuccess={chargerDemandes}
        />
      )}
    </>
  );
}
