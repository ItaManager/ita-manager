import { exigerPermission } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  User,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModalDecisionDerogation } from "./_components/modal-decision-derogation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DerogationDetailPage({ params }: PageProps) {
  // Vérifier permission : derogation:valider ou derogation:demander
  const session = await exigerPermission("derogation:valider");

  const { id } = await params;

  // Récupérer la dérogation avec tous les détails
  const derogation = await prisma.derogationSalariale.findUnique({
    where: { id },
    include: {
      employe: {
        select: {
          id: true,
          matricule: true,
          nom: true,
          prenom: true,
          affectations: {
            where: { dateFin: null },
            take: 1,
            include: {
              poste: {
                select: {
                  libelle: true,
                  niveau: true,
                  direction: { select: { libelle: true } },
                  service: { select: { libelle: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!derogation) {
    notFound();
  }

  const montant = Number(derogation.montant);
  const niveauMin = Number(derogation.niveauMin);
  const niveauMax = Number(derogation.niveauMax);
  const ecartPourcent = Math.round(((montant - niveauMax) / niveauMax) * 100);
  const absEcart = Math.abs(ecartPourcent);

  const posteActuel = derogation.employe.affectations[0]?.poste;

  // Badge écart : <10% (orange), 10-20% (red), >20% (destructive)
  const getBadgeEcart = () => {
    if (absEcart < 10) {
      return (
        <Badge variant="outline" className="border-warning text-warning text-lg px-3 py-1">
          +{ecartPourcent}%
        </Badge>
      );
    } else if (absEcart < 20) {
      return (
        <Badge variant="outline" className="border-destructive text-destructive text-lg px-3 py-1">
          +{ecartPourcent}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="font-semibold text-lg px-3 py-1">
          +{ecartPourcent}%
        </Badge>
      );
    }
  };

  const getBadgeStatut = () => {
    if (derogation.statut === "EN_ATTENTE") {
      return (
        <Badge variant="outline" className="border-warning text-warning">
          En attente de validation
        </Badge>
      );
    } else if (derogation.statut === "VALIDEE") {
      return (
        <Badge variant="outline" className="border-success text-success">
          Validée
        </Badge>
      );
    } else if (derogation.statut === "REFUSEE") {
      return (
        <Badge variant="outline" className="border-destructive text-destructive">
          Refusée
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          Sans objet
        </Badge>
      );
    }
  };

  const NIVEAU_LABELS: Record<string, string> = {
    DIRECTION: "Direction",
    CADRE: "Cadre",
    SUPPORT: "Support",
    OPERATIONNEL: "Opérationnel",
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Link href="/remuneration/derogations">
          <Button variant="ghost" size="sm" className="rounded-full">
            <ArrowLeft className="size-4" />
            Retour aux dérogations
          </Button>
        </Link>
      </div>

      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold">Dérogation salariale</h1>
            {getBadgeStatut()}
          </div>
          <p className="text-sm text-muted-foreground">
            Demandée le{" "}
            {format(new Date(derogation.demandeLe), "d MMMM yyyy à HH:mm", {
              locale: fr,
            })}
          </p>
        </div>

        {/* Actions : Valider / Refuser */}
        {derogation.statut === "EN_ATTENTE" && (
          <div className="flex items-center gap-2">
            <ModalDecisionDerogation
              derogationId={derogation.id}
              decision="REFUSEE"
              employeNom={`${derogation.employe.prenom} ${derogation.employe.nom}`}
              montant={montant}
            />
            <ModalDecisionDerogation
              derogationId={derogation.id}
              decision="VALIDEE"
              employeNom={`${derogation.employe.prenom} ${derogation.employe.nom}`}
              montant={montant}
            />
          </div>
        )}
      </div>

      {/* Informations employé */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="size-5" />
            Informations employé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nom complet</p>
              <p className="font-medium">
                {derogation.employe.prenom} {derogation.employe.nom}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Matricule</p>
              <p className="font-medium">{derogation.employe.matricule}</p>
            </div>
            {posteActuel && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Poste</p>
                  <p className="font-medium">{posteActuel.libelle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Niveau hiérarchique</p>
                  <p className="font-medium">
                    {NIVEAU_LABELS[posteActuel.niveau] || posteActuel.niveau}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Direction</p>
                  <p className="font-medium">{posteActuel.direction.libelle}</p>
                </div>
                {posteActuel.service && (
                  <div>
                    <p className="text-sm text-muted-foreground">Service</p>
                    <p className="font-medium">{posteActuel.service.libelle}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Écart salarial */}
      <Card className="border-warning bg-warning-soft/20">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="size-5 text-warning" />
            Écart par rapport à la grille salariale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Montant demandé */}
            <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Salaire demandé</p>
                <p className="text-2xl font-semibold">
                  {montant.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
              {getBadgeEcart()}
            </div>

            {/* Fourchette grille */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Minimum grille</p>
                <p className="text-lg font-semibold">
                  {niveauMin.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Maximum grille</p>
                <p className="text-lg font-semibold">
                  {niveauMax.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            </div>

            {/* Écart absolu */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Écart absolu</p>
              <p className="text-lg font-semibold text-destructive">
                +{(montant - niveauMax).toLocaleString("fr-FR")} FCFA
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Motif de la demande */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Briefcase className="size-5" />
            Motif de la demande
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{derogation.motif}</p>
        </CardContent>
      </Card>

      {/* Décision (si validée ou refusée) */}
      {derogation.statut !== "EN_ATTENTE" && derogation.decideLe && (
        <Card
          className={
            derogation.statut === "VALIDEE"
              ? "border-success bg-success-soft/20"
              : "border-destructive bg-destructive/10"
          }
        >
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              {derogation.statut === "VALIDEE" ? (
                <>
                  <CheckCircle2 className="size-5 text-success" />
                  Décision de validation
                </>
              ) : (
                <>
                  <XCircle className="size-5 text-destructive" />
                  Décision de refus
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Date de décision</p>
                <p className="font-medium">
                  {format(new Date(derogation.decideLe), "d MMMM yyyy à HH:mm", {
                    locale: fr,
                  })}
                </p>
              </div>

              {derogation.commentaire && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {derogation.statut === "VALIDEE"
                      ? "Commentaire"
                      : "Motif du refus"}
                  </p>
                  <p className="text-sm leading-relaxed">{derogation.commentaire}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avertissement critique */}
      {derogation.statut === "EN_ATTENTE" && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Clock className="size-5 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive mb-1">
                  Décision requise
                </p>
                <p className="text-sm text-muted-foreground">
                  Tant que cette dérogation est en attente, l'employé est{" "}
                  <strong>exclu des exports de paie</strong>. Valider ou refuser
                  rapidement pour ne pas bloquer le cycle de paie.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
