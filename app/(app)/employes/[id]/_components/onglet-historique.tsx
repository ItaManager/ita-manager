"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, User, FileText, Edit, Archive, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface EvenementJournal {
  id: string;
  action: "CREATION" | "MODIFICATION" | "SUPPRESSION" | "ARCHIVAGE" | "VALIDATION";
  entite: string;
  auteurNom: string;
  dateCreation: Date;
  commentaire?: string;
  details?: Record<string, unknown>;
}

interface OngletHistoriqueProps {
  employeId: string;
  evenements: EvenementJournal[];
}

// Badge action avec icône et couleur
function BadgeAction({ action }: { action: EvenementJournal["action"] }) {
  const configs = {
    CREATION: {
      label: "Création",
      icon: CheckCircle,
      className: "bg-green-100 text-green-800 hover:bg-green-100",
    },
    MODIFICATION: {
      label: "Modification",
      icon: Edit,
      className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    },
    SUPPRESSION: {
      label: "Suppression",
      icon: Archive,
      className: "bg-red-100 text-red-800 hover:bg-red-100",
    },
    ARCHIVAGE: {
      label: "Archivage",
      icon: Archive,
      className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
    },
    VALIDATION: {
      label: "Validation",
      icon: CheckCircle,
      className: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    },
  };

  const config = configs[action];
  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      <Icon className="size-3 mr-1" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}

// Icône entité
function IconeEntite({ entite }: { entite: string }) {
  const className = "size-5 text-muted-foreground";

  switch (entite) {
    case "Employe":
      return <User className={className} aria-hidden="true" />;
    case "Contrat":
    case "Avenant":
      return <FileText className={className} aria-hidden="true" />;
    case "DocumentEmploye":
      return <FileText className={className} aria-hidden="true" />;
    case "Affectation":
      return <Edit className={className} aria-hidden="true" />;
    case "DerogationSalariale":
      return <CheckCircle className={className} aria-hidden="true" />;
    default:
      return <History className={className} aria-hidden="true" />;
  }
}

// Libellé entité
function libelleEntite(entite: string): string {
  const labels: Record<string, string> = {
    Employe: "Profil employé",
    Contrat: "Contrat",
    Avenant: "Avenant",
    DocumentEmploye: "Document",
    Affectation: "Affectation",
    DerogationSalariale: "Dérogation salariale",
  };
  return labels[entite] || entite;
}

export function OngletHistorique({ employeId, evenements }: OngletHistoriqueProps) {
  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div>
        <h3 className="text-lg font-semibold">Journal des modifications</h3>
        <p className="text-sm text-muted-foreground">
          {evenements.length} événement{evenements.length > 1 ? "s" : ""} enregistré
          {evenements.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Timeline */}
      {evenements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History
              className="mx-auto size-12 text-muted-foreground/40"
              aria-hidden="true"
            />
            <p className="mt-4 text-sm text-muted-foreground">
              Aucun événement enregistré pour cet employé.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              L'historique des modifications apparaîtra ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Ligne verticale timeline */}
          <div className="absolute left-[21px] top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Événements */}
          <div className="space-y-6">
            {evenements.map((evt, index) => (
              <div key={evt.id} className="relative flex gap-4">
                {/* Point timeline */}
                <div className="relative z-10 flex items-center justify-center size-11 rounded-full bg-white border-2 border-gray-200">
                  <IconeEntite entite={evt.entite} />
                </div>

                {/* Contenu */}
                <Card className="flex-1">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        {/* En-tête */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <BadgeAction action={evt.action} />
                          <span className="text-sm font-medium text-gray-900">
                            {libelleEntite(evt.entite)}
                          </span>
                        </div>

                        {/* Commentaire */}
                        {evt.commentaire && (
                          <p className="text-sm text-gray-700">{evt.commentaire}</p>
                        )}

                        {/* Détails (si présents) */}
                        {evt.details && Object.keys(evt.details).length > 0 && (
                          <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded border">
                            <pre className="whitespace-pre-wrap font-mono">
                              {JSON.stringify(evt.details, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Métadonnées */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-medium">{evt.auteurNom}</span>
                          <span>•</span>
                          <time dateTime={evt.dateCreation.toISOString()}>
                            {format(new Date(evt.dateCreation), "d MMMM yyyy 'à' HH:mm", {
                              locale: fr,
                            })}
                          </time>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
