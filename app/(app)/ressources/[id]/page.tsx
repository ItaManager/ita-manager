import { verifierAccesPage } from "@/lib/auth/page-access";
import { prisma } from "@/lib/db/prisma";
import { verifierPermission } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Wrench, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Fiche Matériel — ITA Manager",
};

export default async function FicheMaterielPage(props: {
  params: Promise<{ id: string }>;
}) {
  await verifierAccesPage("/ressources");

  const params = await props.params;
  const { id } = params;

  // Récupérer le matériel
  const materiel = await prisma.materiel.findUnique({
    where: { id },
    include: {
      famille: true,
      lieuBase: true,
    },
  });

  if (!materiel) {
    notFound();
  }

  // Vérifier permission pour les coûts
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const peutVoirCouts = user
    ? await verifierPermission(user.id, "materiel:coutsAdministratifs")
    : false;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/ressources">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="size-4 mr-2" />
            Retour au registre
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Wrench className="size-6" />
              {materiel.designation}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              {materiel.codeIta}
            </p>
          </div>

          <Badge variant={getStatutVariant(materiel.statut)} className="mt-1">
            {formatStatut(materiel.statut)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Identification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Identification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Code ITA</p>
              <p className="font-mono text-sm">{materiel.codeIta}</p>
            </div>
            {materiel.numeroParcAncien && (
              <div>
                <p className="text-xs text-muted-foreground">Ancien N° Parc</p>
                <p className="font-mono text-sm">{materiel.numeroParcAncien}</p>
              </div>
            )}
            {materiel.codeLong && (
              <div>
                <p className="text-xs text-muted-foreground">Code long</p>
                <p className="font-mono text-sm">{materiel.codeLong}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Désignation</p>
              <p className="text-sm font-medium">{materiel.designation}</p>
            </div>
          </CardContent>
        </Card>

        {/* Caractéristiques */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Caractéristiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Famille</p>
              <p className="text-sm">{materiel.famille.libelle}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="text-sm">{formatTypeMateriel(materiel.type)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Statut</p>
              <p className="text-sm">{formatStatut(materiel.statut)}</p>
            </div>
            {materiel.lieuBase && (
              <div>
                <p className="text-xs text-muted-foreground">Lieu de base</p>
                <p className="text-sm">{materiel.lieuBase.libelle}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations financières */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations financières</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {materiel.dateAcquisition && (
              <div>
                <p className="text-xs text-muted-foreground">Date d'acquisition</p>
                <p className="text-sm">
                  {new Date(materiel.dateAcquisition).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Coût d'acquisition</p>
              {peutVoirCouts && materiel.coutAcquisition !== null ? (
                <p className="text-sm font-medium tabular-nums">
                  {materiel.coutAcquisition.toNumber().toLocaleString("fr-FR")} F CFA
                </p>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="size-3" aria-label="Accès restreint" />
                  <span>Accès restreint (permission requise)</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Détails techniques */}
        {(materiel.numeroSerie || materiel.marque || materiel.modele) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Détails techniques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {materiel.numeroSerie && (
                <div>
                  <p className="text-xs text-muted-foreground">Numéro de série</p>
                  <p className="text-sm font-mono">{materiel.numeroSerie}</p>
                </div>
              )}
              {materiel.marque && (
                <div>
                  <p className="text-xs text-muted-foreground">Marque</p>
                  <p className="text-sm">{materiel.marque}</p>
                </div>
              )}
              {materiel.modele && (
                <div>
                  <p className="text-xs text-muted-foreground">Modèle</p>
                  <p className="text-sm">{materiel.modele}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function formatTypeMateriel(type: string): string {
  const types: Record<string, string> = {
    VEHICULE_LEGER: "Véhicule léger",
    VEHICULE_LOURD: "Véhicule lourd",
    ENGIN: "Engin",
    PETIT_MATERIEL: "Petit matériel",
    CONTENEUR: "Conteneur",
    MOBILIER: "Mobilier",
  };
  return types[type] || type;
}

function formatStatut(statut: string): string {
  const statuts: Record<string, string> = {
    DISPONIBLE: "Disponible",
    EN_MISSION: "En mission",
    DEMOBILISE: "Démobilisé",
    EN_PANNE: "En panne",
    EN_MAINTENANCE: "Maintenance",
    HORS_SERVICE: "Hors service",
    REFORME: "Réformé",
  };
  return statuts[statut] || statut;
}

function getStatutVariant(
  statut: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (statut) {
    case "DISPONIBLE":
      return "default";
    case "EN_MISSION":
      return "outline";
    case "EN_PANNE":
    case "HORS_SERVICE":
      return "destructive";
    case "EN_MAINTENANCE":
      return "outline";
    case "DEMOBILISE":
    case "REFORME":
      return "secondary";
    default:
      return "secondary";
  }
}
