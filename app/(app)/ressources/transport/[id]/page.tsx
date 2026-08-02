import { notFound } from "next/navigation";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Calendar, MapPin, User } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BoutonsActions } from "./_components/boutons-actions";

const TYPE_CONFIG = {
  MATERIEL: { label: "Matériel", variant: "default" as const },
  PERSONNEL: { label: "Personnel", variant: "secondary" as const },
  MIXTE: { label: "Mixte", variant: "outline" as const },
} as const;

const STATUT_CONFIG = {
  EN_ATTENTE: { label: "En attente", variant: "secondary" as const },
  APPROUVEE: { label: "Approuvée", variant: "default" as const },
  AFFECTEE: { label: "Affectée", variant: "default" as const },
  EN_COURS: { label: "En cours", variant: "outline" as const },
  TERMINEE: { label: "Terminée", variant: "secondary" as const },
  ANNULEE: { label: "Annulée", variant: "destructive" as const },
} as const;

type PageParams = Promise<{
  id: string;
}>;

export default async function PageDetailTransport({
  params,
}: {
  params: PageParams;
}) {
  await exigerPermission(PERMISSIONS["transport:demander"].code);

  const { id } = await params;

  const demande = await prisma.demandeTransport.findUnique({
    where: { id },
    include: {
      demandeur: {
        select: {
          id: true,
          email: true,
        },
      },
      materiel: {
        select: {
          id: true,
          codeIta: true,
          designation: true,
          immatriculation: true,
          familleId: true,
          famille: {
            select: {
              libelle: true,
            },
          },
        },
      },
      lieuDepart: {
        select: {
          id: true,
          libelle: true,
        },
      },
      lieuArrivee: {
        select: {
          id: true,
          libelle: true,
        },
      },
      chauffeur: {
        select: {
          id: true,
          nom: true,
          prenom: true,
        },
      },
    },
  });

  if (!demande) {
    notFound();
  }

  const typeConfig = TYPE_CONFIG[demande.type];
  const statutConfig = STATUT_CONFIG[demande.statut];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ressources/transport">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" aria-label="Retour" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-mono">{demande.reference}</h1>
            <p className="text-muted-foreground mt-1">
              Demande de transport · {typeConfig.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={statutConfig.variant}>{statutConfig.label}</Badge>
          <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
        </div>
      </div>

      {/* Actions */}
      <BoutonsActions demande={demande} />

      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Référence
              </label>
              <p className="text-base mt-1 font-mono">{demande.reference}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Type de transport
              </label>
              <div className="mt-1">
                <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Statut
              </label>
              <div className="mt-1">
                <Badge variant={statutConfig.variant}>{statutConfig.label}</Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Demandeur
              </label>
              <p className="text-base mt-1">{demande.demandeur.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Créée le
              </label>
              <p className="text-base mt-1">
                {format(new Date(demande.creeLe), "PPP à HH:mm", { locale: fr })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Détails du transport</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {demande.materiel && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Matériel
                </label>
                <div className="mt-1">
                  <p className="font-medium">{demande.materiel.codeIta}</p>
                  <p className="text-sm text-muted-foreground">
                    {demande.materiel.designation}
                  </p>
                  {demande.materiel.famille && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {demande.materiel.famille.libelle}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Trajet
              </label>
              <div className="flex items-center gap-2 mt-2 p-3 bg-muted/50 rounded-md">
                <div className="flex-1">
                  <p className="font-medium">{demande.lieuDepart.libelle}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{demande.lieuArrivee.libelle}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dates
              </label>
              <div className="mt-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-16">Début:</span>
                  <span className="text-base">
                    {format(new Date(demande.dateDebut), "PPP", { locale: fr })}
                  </span>
                </div>
                {demande.dateFin && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-16">Fin:</span>
                    <span className="text-base">
                      {format(new Date(demande.dateFin), "PPP", { locale: fr })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {demande.chauffeur && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Chauffeur affecté
                </label>
                <p className="text-base mt-1">
                  {demande.chauffeur.prenom} {demande.chauffeur.nom}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {demande.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{demande.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
