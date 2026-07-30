"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSignature, Plus, Eye, Download, Pencil } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { TypeContrat } from "@prisma/client";

interface Avenant {
  id: string;
  motif: string;
  dateEffet: Date;
  nouveauSalaire?: number;
  nouvelleDateFin?: Date;
}

interface Contrat {
  id: string;
  typeContrat: TypeContrat;
  dateDebut: Date;
  dateFin?: Date;
  signe: boolean;
  salaire?: number;
  avenants: Avenant[];
  actif: boolean;
}

interface OngletContratsProps {
  employeId: string;
  contrats: Contrat[];
  typeMainOeuvre: "PERMANENT" | "JOURNALIER";
}

// Badge type de contrat (cohérent avec ligne-employe.tsx)
function BadgeTypeContrat({ type }: { type: TypeContrat }) {
  const colors: Record<TypeContrat, string> = {
    CDI: "bg-blue-100 text-blue-800",
    CDD: "bg-purple-100 text-purple-800",
    INTERIM: "bg-gray-100 text-gray-800",
    STAGE: "bg-yellow-100 text-yellow-800",
  };

  return (
    <Badge className={`${colors[type]} hover:${colors[type]}`}>
      {type}
    </Badge>
  );
}

export function OngletContrats({
  employeId,
  contrats,
  typeMainOeuvre,
}: OngletContratsProps) {
  const handleNouveauContrat = () => {
    // TODO: Ouvrir modale création contrat
    console.log("Nouveau contrat pour", employeId);
  };

  const handleNouvelAvenant = (contratId: string) => {
    // TODO: Ouvrir modale création avenant
    console.log("Nouvel avenant pour contrat", contratId);
  };

  const handleVoirDocument = (url: string) => {
    window.open(url, "_blank");
  };

  const handleTelechargerDocument = (url: string, nomFichier: string) => {
    // TODO: Implémenter le téléchargement
    console.log("Télécharger", nomFichier);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Historique des contrats
          </h3>
          <p className="text-sm text-muted-foreground">
            {contrats.length} contrat{contrats.length > 1 ? "s" : ""} enregistré
            {contrats.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={handleNouveauContrat}>
          <Plus className="size-4 mr-2" aria-hidden="true" />
          Nouveau contrat
        </Button>
      </div>

      {/* Liste des contrats */}
      {contrats.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileSignature
              className="mx-auto size-12 text-muted-foreground/40"
              aria-hidden="true"
            />
            <p className="mt-4 text-sm text-muted-foreground">
              Aucun contrat enregistré pour cet employé.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cliquez sur "Nouveau contrat" pour créer le premier contrat.
            </p>
          </CardContent>
        </Card>
      ) : (
        contrats.map((contrat) => (
          <Card key={contrat.id} className={contrat.actif ? "border-primary" : ""}>
            <CardHeader className="flex flex-row items-start justify-between border-b">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <BadgeTypeContrat type={contrat.typeContrat} />
                  {contrat.actif && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      Contrat actif
                    </Badge>
                  )}
                  {!contrat.signe && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Non signé
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Période :</span>{" "}
                    {format(new Date(contrat.dateDebut), "d MMMM yyyy", { locale: fr })}
                    {contrat.dateFin && (
                      <>
                        {" → "}
                        {format(new Date(contrat.dateFin), "d MMMM yyyy", { locale: fr })}
                      </>
                    )}
                    {!contrat.dateFin && " → Indéterminé"}
                  </p>
                  {contrat.salaire !== undefined && contrat.salaire !== null && (
                    <p>
                      <span className="font-medium">
                        {typeMainOeuvre === "PERMANENT" ? "Salaire mensuel" : "Taux journalier"} :
                      </span>{" "}
                      <span className="font-mono">{contrat.salaire.toLocaleString("fr-FR")} FCFA</span>
                    </p>
                  )}
                  {contrat.avenants.length > 0 && (
                    <p>
                      <span className="font-medium">Avenants :</span> {contrat.avenants.length}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {contrat.actif && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNouvelAvenant(contrat.id)}
                  >
                    <Plus className="size-4 mr-2" aria-hidden="true" />
                    Avenant
                  </Button>
                )}
              </div>
            </CardHeader>

            {/* Avenants */}
            {contrat.avenants.length > 0 && (
              <CardContent className="p-0">
                <div className="divide-y">
                  {contrat.avenants.map((avenant) => (
                    <div
                      key={avenant.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Avenant
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(avenant.dateEffet), "d MMMM yyyy", {
                                locale: fr,
                              })}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{avenant.motif}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {avenant.nouveauSalaire !== undefined &&
                              avenant.nouveauSalaire !== null && (
                                <span>
                                  <span className="font-medium">Nouveau salaire :</span>{" "}
                                  <span className="font-mono">
                                    {avenant.nouveauSalaire.toLocaleString("fr-FR")} FCFA
                                  </span>
                                </span>
                              )}
                            {avenant.nouvelleDateFin && (
                              <span>
                                <span className="font-medium">Nouvelle échéance :</span>{" "}
                                {format(new Date(avenant.nouvelleDateFin), "d MMMM yyyy", {
                                  locale: fr,
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
