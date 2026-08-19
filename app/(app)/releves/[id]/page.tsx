import { notFound } from "next/navigation";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { obtenirReleve } from "@/lib/actions/releves";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ChevronLeft,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { GestionPointages } from "./_components/gestion-pointages";

interface PageReleveDetailProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageReleveDetailProps) {
  const { id } = await params;
  return {
    title: `Relevé ${id.substring(0, 8)} — ITA Manager`,
  };
}

export default async function PageReleveDetail({ params }: PageReleveDetailProps) {
  await verifierAccesPage("/releves");

  const { id } = await params;

  let releve;
  try {
    releve = await obtenirReleve(id);
  } catch (error) {
    notFound();
  }

  const statutConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    BROUILLON: {
      label: "Brouillon",
      icon: FileText,
      color: "#6B7280",
      bg: "#6B728020",
    },
    SOUMIS: {
      label: "Soumis",
      icon: Clock,
      color: "#F59E0B",
      bg: "#F59E0B20",
    },
    VISE: {
      label: "Visé",
      icon: CheckCircle2,
      color: "#10B981",
      bg: "#10B98120",
    },
    REFUSE: {
      label: "Refusé",
      icon: XCircle,
      color: "#EF4444",
      bg: "#EF444420",
    },
  };

  const config = statutConfig[releve.statut];
  const Icon = config.icon;

  const nbPresents = releve.pointages.filter((p) => p.etat === "PRESENT").length;

  // Convertir les Decimal en nombres pour le composant client
  const pointagesSerialises = releve.pointages.map((p) => ({
    ...p,
    heuresTheoretiques: Number(p.heuresTheoretiques),
    heuresReelles: Number(p.heuresReelles),
    heuresSup: Number(p.heuresSup),
  }));

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* En-tête */}
      <div className="mb-6">
        <Link href="/releves">
          <Button variant="ghost" size="sm" className="mb-3 gap-2">
            <ChevronLeft className="size-4" />
            Retour aux relevés
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
              Relevé d'activité
              <Badge
                style={{
                  backgroundColor: config.bg,
                  color: config.color,
                }}
                className="gap-1"
              >
                <Icon className="size-3" />
                {config.label}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(releve.date), "EEEE dd MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Chantier */}
              <div className="flex items-start gap-3">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "#13850b20" }}
                >
                  <MapPin className="size-5" style={{ color: "#13850b" }} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Chantier
                  </p>
                  <p className="text-sm font-medium mt-1">{releve.projet.code}</p>
                  <p className="text-xs text-muted-foreground">{releve.projet.nom}</p>
                </div>
              </div>

              {/* Chef de chantier */}
              <div className="flex items-start gap-3">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "#13850b20" }}
                >
                  <User className="size-5" style={{ color: "#13850b" }} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Chef de chantier
                  </p>
                  <p className="text-sm font-medium mt-1">
                    {releve.chefChantier.prenom} {releve.chefChantier.nom}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {releve.chefChantier.matricule}
                  </p>
                </div>
              </div>

              {/* Effectif */}
              <div className="flex items-start gap-3">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "#13850b20" }}
                >
                  <Users className="size-5" style={{ color: "#13850b" }} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Effectif présent
                  </p>
                  <p className="text-sm font-medium mt-1 tabular-nums">
                    {nbPresents} personne{nbPresents > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {releve.pointages.length} pointage{releve.pointages.length > 1 ? "s" : ""} total
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message si brouillon */}
        {releve.statut === "BROUILLON" && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="py-4">
              <p className="text-sm text-orange-800">
                📝 Ce relevé est en brouillon. Complétez les pointages et les informations avant de
                le soumettre pour validation.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Message si refusé */}
        {releve.statut === "REFUSE" && releve.motifRefus && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4">
              <p className="text-sm font-medium text-red-800 mb-1">❌ Relevé refusé</p>
              <p className="text-sm text-red-700">{releve.motifRefus}</p>
            </CardContent>
          </Card>
        )}

        {/* Pointages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pointages</CardTitle>
          </CardHeader>
          <CardContent>
            {releve.statut === "BROUILLON" ? (
              // Mode édition : gestion des pointages
              pointagesSerialises.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="size-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Aucun pointage enregistré
                  </p>
                  <GestionPointages releveId={releve.id} pointages={pointagesSerialises} />
                </div>
              ) : (
                <GestionPointages releveId={releve.id} pointages={pointagesSerialises} />
              )
            ) : (
              // Mode lecture seule : affichage simple
              releve.pointages.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="size-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">Aucun pointage enregistré</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {releve.pointages.map((pointage) => (
                    <div
                      key={pointage.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {pointage.employe.prenom} {pointage.employe.nom}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pointage.employe.matricule}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {Number(pointage.heuresReelles)}h
                          {Number(pointage.heuresSup) > 0 && (
                            <span className="ml-1 text-[#13850b]">
                              +{Number(pointage.heuresSup)}h
                            </span>
                          )}
                        </div>
                        <Badge
                          variant={pointage.etat === "PRESENT" ? "default" : "secondary"}
                          className="gap-1"
                        >
                          {pointage.etat === "PRESENT" ? (
                            <>
                              <CheckCircle2 className="size-3" />
                              Présent
                            </>
                          ) : pointage.etat === "ABSENT_JUSTIFIE" ? (
                            <>
                              <Clock className="size-3" />
                              Absent justifié
                            </>
                          ) : pointage.etat === "ABSENT_NON_JUSTIFIE" ? (
                            <>
                              <XCircle className="size-3" />
                              Absent non justifié
                            </>
                          ) : pointage.etat === "RETARD" ? (
                            <>
                              <Clock className="size-3" />
                              Retard
                            </>
                          ) : (
                            <>Repos</>
                          )}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Travaux réalisés */}
        {releve.travauxRealises.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Travaux réalisés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {releve.travauxRealises.map((travail) => (
                  <div key={travail.id} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm">{travail.description}</p>
                    {travail.avancementDeclare && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Avancement : {Number(travail.avancementDeclare)}%
                      </p>
                    )}
                    {travail.observation && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {travail.observation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {releve.statut === "BROUILLON" && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" disabled>
                  Modifier
                </Button>
                <Button className="gap-2 bg-[#13850b] hover:bg-[#0f6909]" disabled>
                  Soumettre pour validation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
