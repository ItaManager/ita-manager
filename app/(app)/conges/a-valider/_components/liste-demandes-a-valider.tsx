"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listerDemandesAValider, deciderN1 } from "@/lib/actions/conges";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, X } from "lucide-react";
import { ModalDecision } from "./modal-decision";
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
  decompte: boolean;
};

export function ListeDemandesAValider() {
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
      const data = await listerDemandesAValider();
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

  async function handleDecision(
    decision: "VALIDER" | "REFUSER",
    motif?: string
  ) {
    if (!demandeSelectionnee) return;

    try {
      await deciderN1({
        absenceId: demandeSelectionnee.id,
        decision,
        motif,
      });
      setModalOuverte(false);
      setDemandeSelectionnee(null);
      chargerDemandes();
    } catch (error: any) {
      alert(error.message || "Erreur lors de la décision");
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>À traiter</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chargement...
            </p>
          ) : demandes.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune demande en attente
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Les demandes de vos collaborateurs apparaîtront ici
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
                        Soumise le{" "}
                        {format(new Date(demande.soumieLe), "d MMM à HH:mm", {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="ml-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => ouvrirModal(demande)}
                      className="rounded-full"
                    >
                      <Check className="size-4" />
                      Valider
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => ouvrirModal(demande)}
                      className="rounded-full"
                    >
                      <X className="size-4" />
                      Refuser
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {demandeSelectionnee && (
        <ModalDecision
          ouvert={modalOuverte}
          onOuvertChange={setModalOuverte}
          demande={demandeSelectionnee}
          onDecision={handleDecision}
        />
      )}
    </>
  );
}
