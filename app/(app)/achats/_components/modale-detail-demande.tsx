"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, User, MapPin, FileText, Package, Loader2, FileDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { obtenirDemande, obtenirDonneesDevis, validerInstructionDemande } from "@/lib/actions/achats";
import { genererPDFDevis } from "@/lib/pdf/generer-devis";
import { toast } from "sonner";
import { ModaleInstruireLigne } from "./modale-instruire-ligne";

interface ModaleDetailDemandeProps {
  ouvert: boolean;
  onClose: () => void;
  refDemande: string;
}

const STATUT_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  BROUILLON: { label: "Brouillon", variant: "outline" },
  ATTENTE_N1: { label: "Attente N+1", variant: "secondary" },
  ATTENTE_ACHATS: { label: "Attente Achats", variant: "secondary" },
  ATTENTE_COMITE: { label: "Attente Comité", variant: "secondary" },
  BC_EMIS: { label: "BC émis", variant: "default" },
  SOLDEE: { label: "Soldée", variant: "default" },
  REFUSEE: { label: "Refusée", variant: "destructive" },
};

export function ModaleDetailDemande({ ouvert, onClose, refDemande }: ModaleDetailDemandeProps) {
  const [demande, setDemande] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [articlesSelectionnes, setArticlesSelectionnes] = useState<string[]>([]);
  const [generationEnCours, setGenerationEnCours] = useState(false);
  const [ligneAInstruire, setLigneAInstruire] = useState<any>(null);
  const [validationEnCours, setValidationEnCours] = useState(false);

  useEffect(() => {
    if (ouvert && refDemande) {
      chargerDemande();
      setArticlesSelectionnes([]); // Reset sélection
    }
  }, [ouvert, refDemande]);

  const chargerDemande = async () => {
    setChargement(true);
    try {
      const data = await obtenirDemande(refDemande);
      setDemande(data);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement de la demande");
      onClose();
    } finally {
      setChargement(false);
    }
  };

  const toggleSelection = (ligneId: string) => {
    setArticlesSelectionnes(prev =>
      prev.includes(ligneId)
        ? prev.filter(id => id !== ligneId)
        : [...prev, ligneId]
    );
  };

  const toggleTout = () => {
    if (articlesSelectionnes.length === demande?.lignes.length) {
      setArticlesSelectionnes([]);
    } else {
      setArticlesSelectionnes(demande?.lignes.map((l: any) => l.id) || []);
    }
  };

  const validerInstruction = async () => {
    setValidationEnCours(true);
    try {
      await validerInstructionDemande(refDemande);
      toast.success("Instruction validée avec succès");
      await chargerDemande(); // Recharger la demande
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la validation");
    } finally {
      setValidationEnCours(false);
    }
  };

  const genererDevis = async (ligneIds: string[]) => {
    if (ligneIds.length === 0) {
      toast.error("Aucun article sélectionné");
      return;
    }

    setGenerationEnCours(true);
    try {
      // Récupérer les données pour le PDF depuis le serveur
      const donnees = await obtenirDonneesDevis(refDemande, ligneIds);

      // Générer et télécharger le PDF côté client
      genererPDFDevis(donnees);

      toast.success(`Devis généré pour ${ligneIds.length} article(s)`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la génération du devis");
    } finally {
      setGenerationEnCours(false);
    }
  };

  if (!demande && !chargement) {
    return null;
  }

  const statutInfo = demande ? (STATUT_LABELS[demande.statut] || {
    label: demande.statut,
    variant: "outline" as const,
  }) : { label: "", variant: "outline" as const };

  const montantTotal = demande?.lignes.reduce((sum: number, ligne: any) => {
    return sum + (ligne.prixUnitaireTTC || 0) * ligne.quantite;
  }, 0) || 0;

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader
          className="border-b border-border px-6 py-4 sticky top-0 bg-white z-10"
          style={{ backgroundColor: "var(--primary-soft)" }}
        >
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            {chargement ? "Chargement..." : `Demande ${refDemande}`}
          </DialogTitle>
        </DialogHeader>

        {chargement ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : demande ? (
          <div className="space-y-6 px-6 py-6">
            {/* En-tête avec statut */}
            <div className="bg-white rounded-xl border border-[#0000001a] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-[#1D186C] mb-2">
                    Demande {refDemande}
                  </h2>
                  <Badge variant={statutInfo.variant} className="text-sm">
                    {statutInfo.label}
                  </Badge>
                </div>
                {demande.urgent && (
                  <Badge variant="destructive">Urgent</Badge>
                )}
              </div>
            </div>

            {/* Informations générales */}
            <div className="bg-white rounded-xl border border-[#0000001a] p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Informations générales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="size-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Demandeur
                      </p>
                      <p className="text-foreground">
                        {demande.demandeur.matricule} — {demande.demandeur.prenom}{" "}
                        {demande.demandeur.nom}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="size-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Bénéficiaire
                      </p>
                      <p className="text-foreground">
                        {demande.beneficiaire.matricule} —{" "}
                        {demande.beneficiaire.prenom} {demande.beneficiaire.nom}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="size-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Destination
                      </p>
                      <p className="text-foreground">
                        {demande.destination?.nom || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="size-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Date de besoin
                      </p>
                      <p className="text-foreground">
                        {format(new Date(demande.dateBesoin), "dd MMMM yyyy", {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="size-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Type de demande
                      </p>
                      <p className="text-foreground">
                        {demande.type === "INITIALE" ? "Initiale" : "Régularisation"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="size-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Motif / Description
                      </p>
                      <p className="text-foreground">{demande.description || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Articles demandés */}
            <div className="bg-white rounded-xl border border-[#0000001a] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="size-5 text-[#1D186C]" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Articles demandés
                  </h3>
                </div>

                {/* Boutons d'action - TODO: remettre condition demande?.statut === "ATTENTE_ACHATS" */}
                {demande && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => genererDevis(demande.lignes.map((l: any) => l.id))}
                      disabled={generationEnCours}
                    >
                      <FileDown className="size-4 mr-2" />
                      Générer devis pour tout
                    </Button>
                    {articlesSelectionnes.length > 0 && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => genererDevis(articlesSelectionnes)}
                        disabled={generationEnCours}
                      >
                        <FileDown className="size-4 mr-2" />
                        Générer devis ({articlesSelectionnes.length})
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                      {/* Colonne checkbox - TODO: remettre condition demande?.statut === "ATTENTE_ACHATS" */}
                      {demande && (
                        <th className="w-12 py-3 px-4">
                          <Checkbox
                            checked={articlesSelectionnes.length === demande?.lignes.length && demande?.lignes.length > 0}
                            onCheckedChange={toggleTout}
                            aria-label="Tout sélectionner"
                          />
                        </th>
                      )}
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        #
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Désignation
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Quantité
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Unité
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Prix U. TTC
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Montant TTC
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Fournisseur
                      </th>
                      {/* Colonne action - TODO: remettre condition demande?.statut === "ATTENTE_ACHATS" */}
                      {demande && (
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {demande.lignes.map((ligne: any, index: number) => {
                      const montantLigne =
                        (ligne.prixUnitaireTTC || 0) * ligne.quantite;
                      return (
                        <tr
                          key={ligne.id}
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                        >
                          {/* Checkbox - TODO: remettre condition demande?.statut === "ATTENTE_ACHATS" */}
                          {demande && (
                            <td className="py-3 px-4">
                              <Checkbox
                                checked={articlesSelectionnes.includes(ligne.id)}
                                onCheckedChange={() => toggleSelection(ligne.id)}
                                aria-label={`Sélectionner ${ligne.designation}`}
                              />
                            </td>
                          )}
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground">
                            {ligne.designation}
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground text-right tabular-nums">
                            {ligne.quantite}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {ligne.unite}
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground text-right tabular-nums">
                            {ligne.prixUnitaireTTC
                              ? `${ligne.prixUnitaireTTC.toLocaleString("fr-FR")} F`
                              : "—"}
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground text-right tabular-nums font-medium">
                            {ligne.prixUnitaireTTC
                              ? `${montantLigne.toLocaleString("fr-FR")} F`
                              : "—"}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {ligne.fournisseur?.nom || "—"}
                          </td>
                          {/* Bouton instruire ligne - TODO: remettre condition demande?.statut === "ATTENTE_ACHATS" */}
                          {demande && (
                            <td className="py-3 px-4">
                              <Button
                                variant={ligne.prixUnitaire && ligne.fournisseurId ? "outline" : "default"}
                                size="sm"
                                onClick={() => setLigneAInstruire(ligne)}
                                className="h-8 text-xs"
                              >
                                {ligne.prixUnitaire && ligne.fournisseurId ? "Modifier" : "Instruire"}
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/30">
                    <tr>
                      <td
                        colSpan={5}
                        className="py-3 px-4 text-sm font-medium text-right"
                      >
                        Total TTC :
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-right tabular-nums text-[#1D186C]">
                        {montantTotal > 0
                          ? `${montantTotal.toLocaleString("fr-FR")} F`
                          : "—"}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bouton de validation de l'instruction - TODO: remettre condition demande?.statut === "ATTENTE_ACHATS" */}
              {demande && (() => {
                const toutesLignesInstruites = demande.lignes.every(
                  (l: any) => l.prixUnitaire && l.fournisseurId && l.documentsDevis
                );
                const aucuneLigneInstruite = demande.lignes.every(
                  (l: any) => !l.prixUnitaire && !l.fournisseurId
                );

                return !aucuneLigneInstruite && (
                  <div className="bg-white rounded-xl border border-[#0000001a] p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-semibold text-foreground">
                          {toutesLignesInstruites
                            ? "Instruction complète"
                            : "Instruction en cours"}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {toutesLignesInstruites
                            ? "Tous les articles sont instruits. Vous pouvez valider l'instruction."
                            : `${demande.lignes.filter((l: any) => l.prixUnitaire && l.fournisseurId).length}/${demande.lignes.length} articles instruits.`}
                        </p>
                      </div>
                      <Button
                        variant="default"
                        onClick={validerInstruction}
                        disabled={!toutesLignesInstruites || validationEnCours}
                      >
                        {validationEnCours ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Validation...
                          </>
                        ) : (
                          "Valider l'instruction"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Historique des événements */}
            {demande.evenements.length > 0 && (
              <div className="bg-white rounded-xl border border-[#0000001a] p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Historique
                </h3>
                <div className="space-y-3">
                  {demande.evenements.map((evt: any) => (
                    <div
                      key={evt.id}
                      className="flex items-start gap-3 text-sm pb-3 border-b border-border last:border-0"
                    >
                      <div className="w-32 text-muted-foreground tabular-nums">
                        {format(new Date(evt.timestamp), "dd/MM/yyyy HH:mm", {
                          locale: fr,
                        })}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-foreground">
                          {evt.type}
                        </span>
                        {evt.auteurNom && (
                          <span className="text-muted-foreground">
                            {" "}
                            — {evt.auteurNom}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>

      {/* Modale d'instruction de ligne */}
      {ligneAInstruire && (
        <ModaleInstruireLigne
          ouvert={!!ligneAInstruire}
          onClose={() => setLigneAInstruire(null)}
          ligne={{
            id: ligneAInstruire.id,
            designation: ligneAInstruire.designation,
            quantite: Number(ligneAInstruire.quantite),
            unite: ligneAInstruire.unite,
            fournisseurId: ligneAInstruire.fournisseurId,
            prixUnitaire: ligneAInstruire.prixUnitaire ? Number(ligneAInstruire.prixUnitaire) : null,
            documentsDevis: ligneAInstruire.documentsDevis,
          }}
          refDemande={refDemande}
          onSuccess={() => {
            chargerDemande(); // Recharger la demande
            setLigneAInstruire(null);
          }}
        />
      )}
    </Dialog>
  );
}
