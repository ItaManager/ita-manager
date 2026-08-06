import {
  listerPostes,
  listerDirections,
  listerServices,
} from "@/lib/actions/organisation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, ChevronDown, Download } from "lucide-react";
import Link from "next/link";
import type { NiveauHierarchique } from "@prisma/client";
import { FiltresPostes } from "./filtres-postes";
import { BoutonNouveauPoste } from "./bouton-nouveau-poste";
import { BoutonModifierPoste } from "./bouton-modifier-poste";

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
        <BoutonNouveauPoste
          directions={directions}
          services={servicesData.services}
        />
      </div>

      {/* Filters */}
      <FiltresPostes
        directions={directions}
        services={servicesData.services}
        directionIdActif={directionId}
        serviceIdActif={serviceId}
        niveauActif={niveau}
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
                  Poste
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Code
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Niveau
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Direction
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Service
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {postes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    {recherche || directionId || serviceId || niveau
                      ? "Aucun poste ne correspond à vos critères."
                      : "Aucun poste créé pour le moment."}
                  </td>
                </tr>
              ) : (
                postes.map((poste) => (
                  <tr
                    key={poste.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <input type="checkbox" className="rounded border-border cursor-pointer" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#13850b' }}>
                          <Briefcase className="size-5" />
                        </div>
                        <div className="font-medium text-sm">{poste.libelle}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                      {poste.code}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={NIVEAUX_VARIANTS[poste.niveau]} className="text-xs">
                        {NIVEAUX_LABELS[poste.niveau]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {poste.direction.libelle}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {poste.service?.libelle || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <BoutonModifierPoste
                          poste={poste}
                          directions={directions}
                          services={servicesData.services}
                        />
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
            Affichage de {(page - 1) * 25 + 1} à {Math.min(page * 25, total)} sur {total} poste{total > 1 ? "s" : ""}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Link
                href={`/organisation/postes?page=${page - 1}${directionId ? `&direction=${directionId}` : ""}${serviceId ? `&service=${serviceId}` : ""}${niveau ? `&niveau=${niveau}` : ""}${recherche ? `&recherche=${recherche}` : ""}`}
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
                    href={`/organisation/postes?page=${pageNum}${directionId ? `&direction=${directionId}` : ""}${serviceId ? `&service=${serviceId}` : ""}${niveau ? `&niveau=${niveau}` : ""}${recherche ? `&recherche=${recherche}` : ""}`}
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
                href={`/organisation/postes?page=${page + 1}${directionId ? `&direction=${directionId}` : ""}${serviceId ? `&service=${serviceId}` : ""}${niveau ? `&niveau=${niveau}` : ""}${recherche ? `&recherche=${recherche}` : ""}`}
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
