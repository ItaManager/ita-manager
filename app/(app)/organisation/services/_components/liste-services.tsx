import { listerServices, listerDirections } from "@/lib/actions/organisation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users } from "lucide-react";
import { FiltresServices } from "./filtres-services";
import { Pagination } from "@/components/pagination";
import { BoutonNouveauService } from "./bouton-nouveau-service";
import { BoutonModifierService } from "./bouton-modifier-service";

interface ListeServicesProps {
  page: number;
  directionId?: string;
  recherche?: string;
}

export async function ListeServices({
  page,
  directionId,
  recherche,
}: ListeServicesProps) {
  const { services, total, totalPages } = await listerServices({
    page,
    directionId,
    recherche,
    limite: 25,
  });

  const directions = await listerDirections();

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <FiltresServices
        directions={directions}
        directionIdActif={directionId}
        rechercheActive={recherche}
      />

      {/* Liste */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div>
            <p className="text-sm text-muted-foreground">
              {total} service{total > 1 ? "s" : ""}
            </p>
          </div>
          <BoutonNouveauService directions={directions} />
        </CardHeader>

        {services.length === 0 ? (
          <CardContent className="py-12 text-center">
            <Building2
              className="mx-auto size-12 text-muted-foreground/40"
              aria-hidden="true"
            />
            <p className="mt-4 text-sm text-muted-foreground">
              {recherche || directionId
                ? "Aucun service ne correspond à vos critères."
                : "Aucun service créé pour le moment."}
            </p>
            {!recherche && !directionId && (
              <p className="mt-1 text-xs text-muted-foreground">
                Utilisez le bouton "Nouveau service" pour commencer.
              </p>
            )}
          </CardContent>
        ) : (
          <>
            <CardContent className="p-0">
              <div className="divide-y">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                  >
                    {/* Icône */}
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="size-5" aria-hidden="true" />
                    </div>

                    {/* Informations */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {service.libelle}
                        </p>
                        <Badge variant="outline" className="font-mono text-xs">
                          {service.code}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2
                            className="size-3"
                            aria-hidden="true"
                          />
                          {service.direction.libelle}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="size-3" aria-hidden="true" />
                          {service._count.postes} poste
                          {service._count.postes > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <BoutonModifierService service={service} directions={directions} />
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
                  baseUrl="/organisation/services"
                  searchParams={{ direction: directionId, recherche }}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
