import { listerServices, listerDirections } from "@/lib/actions/organisation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, ChevronDown, Download } from "lucide-react";
import Link from "next/link";
import { FiltresServices } from "./filtres-services";
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
    <>
      {/* Actions Header */}
      <div className="flex items-center justify-end gap-4">
        <Button
          variant="outline"
          className="gap-2 h-12 px-6 text-base border-2 hover:bg-muted hover:border-primary transition-all cursor-pointer shadow-sm hover:shadow-md"
        >
          <Download className="size-5" />
          Télécharger
        </Button>
        <BoutonNouveauService directions={directions} />
      </div>

      {/* Filters */}
      <FiltresServices
        directions={directions}
        directionIdActif={directionId}
        rechercheActive={recherche}
      />

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4">
                  <input type="checkbox" className="rounded border-border cursor-pointer" />
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Service
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Code
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Direction
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Postes
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    {recherche || directionId
                      ? "Aucun service ne correspond à vos critères."
                      : "Aucun service créé pour le moment."}
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr
                    key={service.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <input type="checkbox" className="rounded border-border cursor-pointer" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#13850b' }}>
                          <Building2 className="size-5" />
                        </div>
                        <div className="font-medium text-sm">{service.libelle}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                      {service.code}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {service.direction.libelle}
                    </td>
                    <td className="py-3 px-4 text-sm text-primary">
                      <div className="flex items-center gap-1">
                        <Users className="size-4" />
                        {service._count.postes}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <BoutonModifierService service={service} directions={directions} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <div className="text-sm text-muted-foreground">
            Affichage de {(page - 1) * 25 + 1} à {Math.min(page * 25, total)} sur {total} service{total > 1 ? "s" : ""}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Link
                href={`/organisation/services?page=${page - 1}${directionId ? `&direction=${directionId}` : ""}${recherche ? `&recherche=${recherche}` : ""}`}
                className={`p-2 hover:bg-background rounded-lg transition-colors ${
                  page === 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <ChevronDown className="size-4 rotate-90 text-muted-foreground" />
              </Link>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Link
                    key={pageNum}
                    href={`/organisation/services?page=${pageNum}${directionId ? `&direction=${directionId}` : ""}${recherche ? `&recherche=${recherche}` : ""}`}
                    className={`w-10 h-10 rounded-lg font-medium text-sm flex items-center justify-center transition-colors ${
                      page === pageNum
                        ? "bg-primary text-white"
                        : "hover:bg-background"
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}

              <Link
                href={`/organisation/services?page=${page + 1}${directionId ? `&direction=${directionId}` : ""}${recherche ? `&recherche=${recherche}` : ""}`}
                className={`p-2 hover:bg-background rounded-lg transition-colors ${
                  page === totalPages ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <ChevronDown className="size-4 -rotate-90 text-muted-foreground" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
