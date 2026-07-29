import {
  listerPostes,
  listerDirections,
  listerServices,
} from "@/lib/actions/organisation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building2, Users, Layers } from "lucide-react";
import { FiltresPostes } from "./filtres-postes";
import { Pagination } from "@/components/pagination";
import { BoutonNouveauPoste } from "./bouton-nouveau-poste";
import { BoutonModifierPoste } from "./bouton-modifier-poste";
import type { NiveauHierarchique } from "@prisma/client";

interface ListePostesProps {
  page: number;
  directionId?: string;
  serviceId?: string;
  niveau?: NiveauHierarchique;
  recherche?: string;
}

// Libellés des niveaux hiérarchiques
const NIVEAUX_LABELS: Record<NiveauHierarchique, string> = {
  DIRECTION: "Direction",
  CADRE: "Cadre",
  SUPPORT: "Support",
  OPERATIONNEL: "Opérationnel",
};

// Couleurs des badges niveau (suivant R-01 : label visible)
const NIVEAUX_VARIANTS: Record<
  NiveauHierarchique,
  "default" | "secondary" | "outline"
> = {
  DIRECTION: "default",
  CADRE: "secondary",
  SUPPORT: "outline",
  OPERATIONNEL: "outline",
};

export async function ListePostes({
  page,
  directionId,
  serviceId,
  niveau,
  recherche,
}: ListePostesProps) {
  const { postes, total, totalPages } = await listerPostes({
    page,
    directionId,
    serviceId,
    niveau,
    recherche,
    limite: 25,
  });

  const [directions, servicesData] = await Promise.all([
    listerDirections(),
    listerServices({}),
  ]);

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <FiltresPostes
        directions={directions}
        services={servicesData.services}
        directionIdActif={directionId}
        serviceIdActif={serviceId}
        niveauActif={niveau}
        rechercheActive={recherche}
      />

      {/* Liste */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div>
            <p className="text-sm text-muted-foreground">
              {total} poste{total > 1 ? "s" : ""}
            </p>
          </div>
          <BoutonNouveauPoste
            directions={directions}
            services={servicesData.services}
          />
        </CardHeader>

        {postes.length === 0 ? (
          <CardContent className="py-12 text-center">
            <Briefcase
              className="mx-auto size-12 text-muted-foreground/40"
              aria-hidden="true"
            />
            <p className="mt-4 text-sm text-muted-foreground">
              {recherche || directionId || serviceId || niveau
                ? "Aucun poste ne correspond à vos critères."
                : "Aucun poste créé pour le moment."}
            </p>
            {!recherche && !directionId && !serviceId && !niveau && (
              <p className="mt-1 text-xs text-muted-foreground">
                Utilisez le bouton &quot;Nouveau poste&quot; pour commencer.
              </p>
            )}
          </CardContent>
        ) : (
          <>
            <CardContent className="p-0">
              <div className="divide-y">
                {postes.map((poste) => (
                  <div
                    key={poste.id}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                  >
                    {/* Icône */}
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Briefcase className="size-5" aria-hidden="true" />
                    </div>

                    {/* Informations */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {poste.libelle}
                        </p>
                        <Badge variant="outline" className="font-mono text-xs">
                          {poste.code}
                        </Badge>
                        <Badge variant={NIVEAUX_VARIANTS[poste.niveau]}>
                          {NIVEAUX_LABELS[poste.niveau]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="size-3" aria-hidden="true" />
                          {poste.direction.libelle}
                        </span>
                        {poste.service && (
                          <span className="flex items-center gap-1">
                            <Users className="size-3" aria-hidden="true" />
                            {poste.service.libelle}
                          </span>
                        )}
                        {(poste.reserveAdmin ||
                          poste.titulaireUnique ||
                          !poste.ouvreDroitConges) && (
                          <span className="flex items-center gap-1">
                            <Layers className="size-3" aria-hidden="true" />
                            {[
                              poste.reserveAdmin && "Admin",
                              poste.titulaireUnique && "Unique",
                              !poste.ouvreDroitConges && "Sans congés",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <BoutonModifierPoste
                      poste={poste}
                      directions={directions}
                      services={servicesData.services}
                    />
                  </div>
                ))}
              </div>
            </CardContent>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t p-4">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  baseUrl="/organisation/postes"
                  searchParams={{
                    direction: directionId,
                    service: serviceId,
                    niveau,
                    recherche,
                  }}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
