import { listerDirections } from "@/lib/actions/organisation";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Briefcase, Users } from "lucide-react";
import type { NiveauHierarchique } from "@prisma/client";

const LIBELLES_NIVEAU: Record<NiveauHierarchique, string> = {
  DIRECTION: "Direction",
  CADRE: "Cadre",
  SUPPORT: "Support",
  OPERATIONNEL: "Opérationnel",
};

const COULEURS_NIVEAU: Record<NiveauHierarchique, string> = {
  DIRECTION: "bg-accent-soft text-accent dark:bg-accent dark:text-accent",
  CADRE: "bg-primary-soft text-primary dark:bg-primary dark:text-primary",
  SUPPORT: "bg-success-soft text-success dark:bg-success dark:text-success",
  OPERATIONNEL: "bg-warning-soft text-warning dark:bg-warning dark:text-warning",
};

export async function VueOrganigramme() {
  const directions = await listerDirections();

  // Charger tous les services et postes
  const servicesParDirection = await Promise.all(
    directions.map(async (direction) => {
      const services = await prisma.service.findMany({
        where: { directionId: direction.id, archiveLe: null },
        orderBy: { ordre: "asc" },
        include: {
          postes: {
            where: { archiveLe: null },
            orderBy: [{ niveau: "asc" }, { libelle: "asc" }],
          },
        },
      });

      const postesSansService = await prisma.poste.findMany({
        where: {
          directionId: direction.id,
          serviceId: null,
          archiveLe: null,
        },
        orderBy: [{ niveau: "asc" }, { libelle: "asc" }],
      });

      return { direction, services, postesSansService };
    })
  );

  return (
    <div className="space-y-6">
      {servicesParDirection.map(({ direction, services, postesSansService }) => (
        <Card key={direction.id}>
          <CardHeader className="border-b bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="size-5" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {direction.libelle}
                  <Badge variant="outline" className="font-mono text-xs">
                    {direction.code}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {direction._count.services} service
                  {direction._count.services > 1 ? "s" : ""} ·{" "}
                  {direction._count.postes} poste
                  {direction._count.postes > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Postes sans service (rattachés directement à la direction) */}
              {postesSansService.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Briefcase className="size-4" aria-hidden="true" />
                    Postes de direction
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {postesSansService.map((poste) => (
                      <div
                        key={poste.id}
                        className="rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              {poste.libelle}
                            </p>
                            <Badge
                              variant="secondary"
                              className={COULEURS_NIVEAU[poste.niveau]}
                            >
                              {LIBELLES_NIVEAU[poste.niveau]}
                            </Badge>
                          </div>
                          <Badge variant="outline" className="shrink-0 font-mono text-xs">
                            {poste.code}
                          </Badge>
                        </div>
                        {(poste.reserveAdmin || poste.titulaireUnique || !poste.ouvreDroitConges) && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {poste.reserveAdmin && (
                              <Badge variant="outline" className="text-xs">
                                Admin
                              </Badge>
                            )}
                            {poste.titulaireUnique && (
                              <Badge variant="outline" className="text-xs">
                                Unique
                              </Badge>
                            )}
                            {!poste.ouvreDroitConges && (
                              <Badge variant="outline" className="text-xs">
                                Sans congés
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services et leurs postes */}
              {services.map((service) => (
                <div key={service.id} className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Users className="size-4" aria-hidden="true" />
                    {service.libelle}
                    <Badge variant="outline" className="font-mono text-xs">
                      {service.code}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ({service.postes.length} poste
                      {service.postes.length > 1 ? "s" : ""})
                    </span>
                  </h3>

                  {service.postes.length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                      Aucun poste dans ce service
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {service.postes.map((poste) => (
                        <div
                          key={poste.id}
                          className="rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium text-foreground">
                                {poste.libelle}
                              </p>
                              <Badge
                                variant="secondary"
                                className={COULEURS_NIVEAU[poste.niveau]}
                              >
                                {LIBELLES_NIVEAU[poste.niveau]}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="shrink-0 font-mono text-xs">
                              {poste.code}
                            </Badge>
                          </div>
                          {(poste.reserveAdmin || poste.titulaireUnique || !poste.ouvreDroitConges) && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {poste.reserveAdmin && (
                                <Badge variant="outline" className="text-xs">
                                  Admin
                                </Badge>
                              )}
                              {poste.titulaireUnique && (
                                <Badge variant="outline" className="text-xs">
                                  Unique
                                </Badge>
                              )}
                              {!poste.ouvreDroitConges && (
                                <Badge variant="outline" className="text-xs">
                                  Sans congés
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* État vide si aucun service */}
              {services.length === 0 && postesSansService.length === 0 && (
                <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Cette direction ne contient ni service ni poste pour le moment.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
