/**
 * Page de détail d'une demande de ressource (M8)
 *
 * Affichage :
 * - Informations générales (nature, projet, période, motif)
 * - Lignes de demande (compétence/matériel, quantité)
 * - Historique de validation (N+1, service)
 *
 * Actions conditionnelles selon statut :
 * - BROUILLON : Soumettre
 * - SOUMISE : Valider N+1 (si supérieur), Refuser N+1
 * - VALIDEE_N1 : Valider service (si arbitrer), Refuser service, Affecter matériel
 * - VALIDEE_SERVICE/AFFECTEE/REFUSEE : Lecture seule
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Check, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  soumettreDemandeRessource,
  validerDemandeN1,
  validerDemandeService,
  refuserDemandeRessource,
} from "@/lib/actions/ressources";

type Ligne = {
  id: string;
  competence: string | null;
  quantite: number | null;
  materielId: string | null;
  materiel: { codeIta: string; designation: string } | null;
};

type Demande = {
  id: string;
  nature: string;
  projet: { code: string; nom: string };
  dateDebut: Date;
  dateFin: Date;
  motif: string;
  statut: string;
  demandeurNom: string;
  lignes: Ligne[];
  valideN1ParId: string | null;
  valideN1Le: Date | null;
  motifRefusN1: string | null;
  valideServiceParId: string | null;
  valideServiceLe: Date | null;
  motifRefusService: string | null;
  creeLe: Date;
};

export default function PageDetailDemandeRessource({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [demande, setDemande] = useState<Demande | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionEnCours, setActionEnCours] = useState(false);
  const [dialogRefus, setDialogRefus] = useState<{
    ouvert: boolean;
    etape: "N1" | "SERVICE";
  }>({ ouvert: false, etape: "N1" });
  const [motifRefus, setMotifRefus] = useState("");

  useEffect(() => {
    chargerDemande();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function chargerDemande() {
    try {
      setLoading(true);
      const response = await fetch(`/api/demandes-ressources/${params.id}`);
      if (!response.ok) throw new Error("Demande introuvable");
      const data = await response.json();
      setDemande(data);
    } catch (error) {
      toast.error("Erreur de chargement", {
        description:
          error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSoumettre() {
    if (!demande) return;
    setActionEnCours(true);
    try {
      await soumettreDemandeRessource(demande.id);
      toast.success("Demande soumise", {
        description: "La demande a été envoyée pour validation N+1",
      });
      router.push("/ressources/demandes");
    } catch (error) {
      toast.error("Erreur", {
        description:
          error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setActionEnCours(false);
    }
  }

  async function handleValiderN1() {
    if (!demande) return;
    setActionEnCours(true);
    try {
      await validerDemandeN1(demande.id);
      toast.success("Demande validée", {
        description: "La demande passe au service compétent",
      });
      chargerDemande();
    } catch (error) {
      toast.error("Erreur", {
        description:
          error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setActionEnCours(false);
    }
  }

  async function handleValiderService() {
    if (!demande) return;
    setActionEnCours(true);
    try {
      await validerDemandeService(demande.id);
      toast.success("Demande validée", {
        description: "La demande est validée par le service",
      });
      chargerDemande();
    } catch (error) {
      toast.error("Erreur", {
        description:
          error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setActionEnCours(false);
    }
  }

  async function handleRefuser() {
    if (!demande || motifRefus.trim().length < 10) {
      toast.error("Motif requis", {
        description: "Le motif de refus doit faire au moins 10 caractères",
      });
      return;
    }

    setActionEnCours(true);
    try {
      await refuserDemandeRessource({
        demandeId: demande.id,
        motif: motifRefus,
        etape: dialogRefus.etape,
      });
      toast.success("Demande refusée", {
        description: "Le demandeur a été notifié",
      });
      setDialogRefus({ ouvert: false, etape: "N1" });
      setMotifRefus("");
      chargerDemande();
    } catch (error) {
      toast.error("Erreur", {
        description:
          error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setActionEnCours(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!demande) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Demande introuvable</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header avec breadcrumb */}
      <div className="mb-6">
        <Link href="/ressources/demandes">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux demandes
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">
              Demande de ressource {formatNature(demande.nature)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {demande.projet.code} · {demande.projet.nom}
            </p>
          </div>
          <Badge variant={getStatutVariant(demande.statut)}>
            {formatStatut(demande.statut)}
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Nature</p>
              <Badge variant={getNatureVariant(demande.nature)} className="mt-1">
                {formatNature(demande.nature)}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Demandeur</p>
              <p className="text-sm mt-1">{demande.demandeurNom}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Projet</p>
              <p className="text-sm mt-1 font-medium">{demande.projet.code}</p>
              <p className="text-xs text-muted-foreground">
                {demande.projet.nom}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Période</p>
              <p className="text-sm mt-1">
                {formatPeriode(demande.dateDebut, demande.dateFin)}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground">Motif</p>
              <p className="text-sm mt-1">{demande.motif}</p>
            </div>
          </CardContent>
        </Card>

        {/* Lignes de demande */}
        <Card>
          <CardHeader>
            <CardTitle>Lignes de demande</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {demande.nature === "HUMAINE"
                      ? "Compétence"
                      : "Matériel"}
                  </TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Statut affectation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demande.lignes.map((ligne) => (
                  <TableRow key={ligne.id}>
                    <TableCell>
                      {demande.nature === "HUMAINE" ? (
                        <span className="text-sm">{ligne.competence}</span>
                      ) : ligne.materiel ? (
                        <div>
                          <div className="font-medium font-mono text-sm">
                            {ligne.materiel.codeIta}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {ligne.materiel.designation}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Non spécifié
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {ligne.quantite ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Non affecté</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Historique de validation */}
        <Card>
          <CardHeader>
            <CardTitle>Historique de validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Validation N+1 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {demande.valideN1Le ? (
                  <Check className="h-4 w-4 text-success" />
                ) : demande.motifRefusN1 ? (
                  <X className="h-4 w-4 text-destructive" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted" />
                )}
                <p className="font-medium text-sm">Validation N+1</p>
              </div>
              {demande.valideN1Le && (
                <p className="text-xs text-muted-foreground ml-6">
                  Validée le {formatDateLongue(demande.valideN1Le)}
                </p>
              )}
              {demande.motifRefusN1 && (
                <div className="ml-6 mt-2 p-3 bg-destructive/10 rounded-md">
                  <p className="text-xs font-medium text-destructive mb-1">
                    Refusée
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {demande.motifRefusN1}
                  </p>
                </div>
              )}
              {!demande.valideN1Le && !demande.motifRefusN1 && (
                <p className="text-xs text-muted-foreground ml-6">
                  En attente de validation
                </p>
              )}
            </div>

            {/* Validation service */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {demande.valideServiceLe ? (
                  <Check className="h-4 w-4 text-success" />
                ) : demande.motifRefusService ? (
                  <X className="h-4 w-4 text-destructive" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted" />
                )}
                <p className="font-medium text-sm">
                  Validation service (
                  {demande.nature === "HUMAINE" ? "RH" : "Logistique"})
                </p>
              </div>
              {demande.valideServiceLe && (
                <p className="text-xs text-muted-foreground ml-6">
                  Validée le {formatDateLongue(demande.valideServiceLe)}
                </p>
              )}
              {demande.motifRefusService && (
                <div className="ml-6 mt-2 p-3 bg-destructive/10 rounded-md">
                  <p className="text-xs font-medium text-destructive mb-1">
                    Refusée
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {demande.motifRefusService}
                  </p>
                </div>
              )}
              {!demande.valideServiceLe &&
                !demande.motifRefusService &&
                !demande.valideN1Le && (
                  <p className="text-xs text-muted-foreground ml-6">
                    En attente de validation N+1
                  </p>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Actions conditionnelles */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              {demande.statut === "BROUILLON" && (
                <Button
                  onClick={handleSoumettre}
                  disabled={actionEnCours}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {actionEnCours ? "Soumission..." : "Soumettre la demande"}
                </Button>
              )}

              {demande.statut === "SOUMISE" && (
                <>
                  <Button
                    onClick={handleValiderN1}
                    disabled={actionEnCours}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {actionEnCours ? "Validation..." : "Valider (N+1)"}
                  </Button>
                  <Button
                    onClick={() =>
                      setDialogRefus({ ouvert: true, etape: "N1" })
                    }
                    disabled={actionEnCours}
                    variant="destructive"
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Refuser
                  </Button>
                </>
              )}

              {demande.statut === "VALIDEE_N1" && (
                <>
                  <Button
                    onClick={handleValiderService}
                    disabled={actionEnCours}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {actionEnCours
                      ? "Validation..."
                      : "Valider (service)"}
                  </Button>
                  <Button
                    onClick={() =>
                      setDialogRefus({ ouvert: true, etape: "SERVICE" })
                    }
                    disabled={actionEnCours}
                    variant="destructive"
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Refuser
                  </Button>
                  {demande.nature === "MATERIELLE" && (
                    <Button variant="outline" className="gap-2">
                      <Package className="h-4 w-4" />
                      Affecter matériel
                    </Button>
                  )}
                </>
              )}

              {(demande.statut === "VALIDEE_SERVICE" ||
                demande.statut === "AFFECTEE" ||
                demande.statut === "REFUSEE") && (
                <p className="text-sm text-muted-foreground">
                  Cette demande est en lecture seule
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de refus */}
      <Dialog
        open={dialogRefus.ouvert}
        onOpenChange={(ouvert) =>
          setDialogRefus({ ...dialogRefus, ouvert })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la demande</DialogTitle>
            <DialogDescription>
              Précisez le motif du refus (minimum 10 caractères).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="motif">Motif du refus</Label>
              <Textarea
                id="motif"
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                placeholder="Ex: Ressources non disponibles pour cette période"
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {motifRefus.length} / 10 caractères minimum
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogRefus({ ouvert: false, etape: "N1" });
                setMotifRefus("");
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefuser}
              disabled={actionEnCours || motifRefus.trim().length < 10}
            >
              {actionEnCours ? "Refus..." : "Confirmer le refus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatNature(nature: string): string {
  return nature === "HUMAINE" ? "Humaine" : "Matérielle";
}

function getNatureVariant(
  nature: string
): "default" | "secondary" | "outline" {
  return nature === "HUMAINE" ? "default" : "secondary";
}

function formatStatut(statut: string): string {
  const statuts: Record<string, string> = {
    BROUILLON: "Brouillon",
    SOUMISE: "Soumise",
    VALIDEE_N1: "Validée N+1",
    VALIDEE_SERVICE: "Validée service",
    AFFECTEE: "Affectée",
    REFUSEE: "Refusée",
    ANNULEE: "Annulée",
  };
  return statuts[statut] || statut;
}

function getStatutVariant(
  statut: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (statut) {
    case "BROUILLON":
      return "outline";
    case "SOUMISE":
      return "secondary";
    case "VALIDEE_N1":
    case "VALIDEE_SERVICE":
      return "default";
    case "AFFECTEE":
      return "default";
    case "REFUSEE":
    case "ANNULEE":
      return "destructive";
    default:
      return "secondary";
  }
}

function formatPeriode(debut: Date, fin: Date): string {
  const d = new Date(debut).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const f = new Date(fin).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${d} → ${f}`;
}

function formatDateLongue(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
