"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, FileText, Download } from "lucide-react";
import { formaterDateCivile, joursEntre } from "@/lib/dates";
import {
  consulterPieceAdministrative,
  type PieceDetaillee,
} from "@/lib/actions/logistique";
import { toast } from "sonner";
import { ModalRenouvelerPiece } from "./modal-renouveler-piece";

interface ModalPieceProps {
  pieceId: string | null;
  onClose: () => void;
}

export function ModalPiece({ pieceId, onClose }: ModalPieceProps) {
  const [piece, setPiece] = useState<PieceDetaillee | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRenouvelerModal, setShowRenouvelerModal] = useState(false);

  useEffect(() => {
    if (pieceId) {
      setLoading(true);
      consulterPieceAdministrative(pieceId)
        .then((data) => setPiece(data))
        .catch((error) => {
          toast.error("Erreur lors du chargement de la pièce");
          console.error(error);
          onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [pieceId, onClose]);

  function getBanniereClasses(etat: string) {
    if (etat === "PERIME") return "bg-destructive/10 text-destructive border-destructive/20";
    if (etat === "EN_ALERTE") return "bg-orange-50 text-orange-900 border-orange-200";
    return "bg-green-50 text-green-900 border-green-200";
  }

  function getLibelleEtat(piece: PieceDetaillee): string {
    const joursRestants = joursEntre(new Date(), piece.dateExpiration);

    if (piece.etat === "PERIME") {
      return `Périmé depuis ${Math.abs(joursRestants)} jours`;
    }
    if (piece.etat === "EN_ALERTE") {
      return `Échéance proche — ${joursRestants} jours restants`;
    }
    return `Valide encore ${joursRestants} jours`;
  }

  if (!pieceId) return null;

  return (
    <>
      <Dialog open={!!pieceId} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : piece ? (
            <>
              <DialogHeader>
                <DialogTitle>{piece.type.libelle}</DialogTitle>
                <DialogDescription>
                  {piece.materiel.codeIta} · {piece.materiel.designation} · {piece.numero}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="piece" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="piece">La pièce</TabsTrigger>
                  <TabsTrigger value="historique">
                    Historique ({(piece.renouvellementDe ? 1 : 0) + piece.renouvellements.length + 1})
                  </TabsTrigger>
                  <TabsTrigger value="type">Le type</TabsTrigger>
                </TabsList>

                {/* Onglet 1 : La pièce */}
                <TabsContent value="piece" className="space-y-6 mt-6">
                  {/* Bannière état */}
                  <div className={`rounded-lg border px-6 py-4 text-center ${getBanniereClasses(piece.etat)}`}>
                    <p className="text-lg font-semibold">{getLibelleEtat(piece)}</p>
                    <p className="text-sm mt-1">Expiration le {formaterDateCivile(piece.dateExpiration)}</p>
                  </div>

                  {/* Informations */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Numéro</p>
                        <p className="text-sm font-mono font-medium">{piece.numero}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Émetteur</p>
                        <p className="text-sm">{piece.emetteur}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Date d'édition</p>
                        <p className="text-sm">{formaterDateCivile(piece.dateEdition)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Date d'expiration</p>
                        <p className="text-sm font-medium">{formaterDateCivile(piece.dateExpiration)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Lieu du matériel</p>
                        <p className="text-sm">{piece.materiel.lieuBase || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Montant</p>
                        {piece.montant === null ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Lock className="size-3" />
                            <span>Accès restreint</span>
                          </div>
                        ) : (
                          <p className="text-sm font-medium tabular-nums">
                            {piece.montant.toLocaleString("fr-FR")} F
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scan de la pièce (placeholder) */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Scan de la pièce</h3>
                    <div className="border rounded-lg p-4 flex items-center justify-between bg-muted/30">
                      <div className="flex items-center gap-3">
                        <FileText className="size-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{piece.numero}.pdf</p>
                          <p className="text-xs text-muted-foreground">Document numérisé</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="size-4" />
                        Consulter
                      </Button>
                    </div>
                  </div>

                  {/* Boutons */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose}>
                      Fermer
                    </Button>
                    <Button onClick={() => setShowRenouvelerModal(true)} className="bg-green-600 hover:bg-green-700">
                      Renouveler
                    </Button>
                  </div>
                </TabsContent>

                {/* Onglet 2 : Historique */}
                <TabsContent value="historique" className="space-y-6 mt-6">
                  <p className="text-sm text-muted-foreground">
                    {(piece.renouvellementDe ? 1 : 0) + piece.renouvellements.length + 1} versions successives.
                    Renouveler crée une nouvelle pièce — les précédentes restent consultables.
                  </p>

                  <div className="space-y-3">
                    {/* Pièce actuelle */}
                    <Card className="border-2 border-primary">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-lg font-semibold font-mono">{piece.numero}</p>
                              <Badge>actuelle</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{piece.emetteur}</p>
                            <p className="text-sm text-muted-foreground">
                              {formaterDateCivile(piece.dateEdition)} → {formaterDateCivile(piece.dateExpiration)}
                            </p>
                            {piece.montant !== null && (
                              <p className="text-sm font-medium tabular-nums mt-1">
                                {piece.montant.toLocaleString("fr-FR")} F
                              </p>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm font-medium ${piece.etat === "PERIME" ? "text-destructive" : piece.etat === "EN_ALERTE" ? "text-orange-600" : "text-green-600"}`}>
                          {piece.etat === "PERIME" && `périmé ${Math.abs(joursEntre(new Date(), piece.dateExpiration))} j`}
                          {piece.etat === "EN_ALERTE" && `J−${joursEntre(new Date(), piece.dateExpiration)}`}
                          {piece.etat === "VALIDE" && `valide`}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Pièce précédente */}
                    {piece.renouvellementDe && (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-lg font-semibold font-mono">{piece.renouvellementDe.numero}</p>
                                <Badge variant="outline">remplacée</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Expirait le {formaterDateCivile(piece.renouvellementDe.dateExpiration)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Cumul (si montants visibles) */}
                  {piece.montant !== null && (
                    <div className="border-t pt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Cumul sur {(piece.renouvellementDe ? 1 : 0) + 1} année{(piece.renouvellementDe ? 1 : 0) + 1 > 1 ? "s" : ""}
                      </p>
                      <p className="text-lg font-bold tabular-nums">
                        {piece.montant.toLocaleString("fr-FR")} F
                      </p>
                    </div>
                  )}

                  {/* Boutons */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose}>
                      Fermer
                    </Button>
                    <Button onClick={() => setShowRenouvelerModal(true)} className="bg-green-600 hover:bg-green-700">
                      Renouveler
                    </Button>
                  </div>
                </TabsContent>

                {/* Onglet 3 : Le type */}
                <TabsContent value="type" className="space-y-6 mt-6">
                  <p className="text-sm text-muted-foreground">
                    Les types de pièce sont un <strong>référentiel</strong>, pas une liste figée dans le code.
                    Créer une obligation nouvelle fait apparaître une colonne au tableau, sans redéploiement.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Libellé</p>
                      <p className="text-sm font-medium">{piece.type.libelle}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Périodicité</p>
                      <p className="text-sm">
                        {piece.type.periodiciteMois ? `${piece.type.periodiciteMois} mois` : "Non périodique"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Délai d'alerte</p>
                      <p className="text-sm">{piece.type.delaiAlerteJours} jours avant expiration</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Bloquante</p>
                      <p className="text-sm">{piece.type.bloquante ? "Oui — empêche la sortie" : "Non"}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Ordre d'affichage</p>
                      <p className="text-sm">colonne {piece.type.ordreAffichage}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-2">S'applique aux types de matériel</p>
                      <div className="flex flex-wrap gap-2">
                        {piece.type.typesMateriel.map((type) => (
                          <Badge key={type} variant="secondary">
                            {type === "VEHICULE_LEGER" && "Véhicules légers"}
                            {type === "VEHICULE_LOURD" && "Poids lourds"}
                            {type === "ENGIN" && "Engins"}
                            {type === "PETIT_MATERIEL" && "Petit matériel"}
                            {type === "CONTENEUR" && "Conteneurs"}
                            {type === "MOBILIER" && "Mobilier"}
                          </Badge>
                        ))}
                      </div>
                      {piece.type.typesMateriel.length === 0 && (
                        <p className="text-sm text-muted-foreground">Tous les types</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Un matériel d'un autre type affiche <strong>s.o.</strong> dans cette colonne.
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                    <p className="flex items-start gap-2">
                      <span className="text-blue-600">ℹ</span>
                      <span>
                        L'état — valide, en alerte, périmé — se <strong>calcule</strong> depuis la date
                        d'expiration et le délai d'alerte du type. Il n'est jamais stocké : il serait faux dès le lendemain.
                      </span>
                    </p>
                  </div>

                  {/* Boutons */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose}>
                      Fermer
                    </Button>
                    <Button onClick={() => setShowRenouvelerModal(true)} className="bg-green-600 hover:bg-green-700">
                      Renouveler
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Pièce introuvable
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de renouvellement */}
      {piece && (
        <ModalRenouvelerPiece
          piece={piece}
          open={showRenouvelerModal}
          onClose={() => {
            setShowRenouvelerModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
