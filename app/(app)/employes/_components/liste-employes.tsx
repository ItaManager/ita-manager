import { listerEmployes } from "@/lib/actions/employes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown } from "lucide-react";
import Link from "next/link";
import type { TypeMainOeuvre } from "@prisma/client";
import { FiltresEmployesClient } from "./filtres-employes-client";
import { BoutonAjouterEmploye } from "./bouton-ajouter-employe";
import { BoutonAjouterJournalier } from "./bouton-ajouter-journalier";
import { BoutonModifierEmploye } from "./bouton-modifier-employe";

interface DonneesReference {
  nationalites: Array<{ id: string; libelle: string }>;
  directions: Array<{ id: string; libelle: string }>;
  services: Array<{ id: string; libelle: string; directionId: string }>;
  postes: Array<{ id: string; libelle: string; code: string; serviceId: string | null; directionId: string }>;
  employes: Array<{ id: string; matricule: string; nom: string; prenom: string }>;
  projets: Array<{ id: string; code: string; nom: string }>;
}

interface ListeEmployesProps {
  page: number;
  recherche?: string;
  directionId?: string;
  serviceId?: string;
  typeMainOeuvre?: TypeMainOeuvre;
  statutDossier?: "COMPLET" | "INCOMPLET";
  donneesReference: DonneesReference;
}

export async function ListeEmployes({
  page,
  recherche,
  directionId,
  serviceId,
  typeMainOeuvre,
  statutDossier,
  donneesReference,
}: ListeEmployesProps) {
  const { items: employes, total, pages } = await listerEmployes({
    page,
    recherche,
    directionId,
    serviceId,
    typeMainOeuvre,
    statutDossier,
  });

  const getStatusBadge = (employe: any) => {
    if (!employe.actif) {
      return <Badge className="bg-destructive-soft text-destructive">Archivé</Badge>;
    }
    if (employe.typeMainOeuvre === "PERMANENT") {
      return <Badge className="bg-success-soft text-success">Actif</Badge>;
    }
    return <Badge className="bg-warning-soft text-warning">Journalier</Badge>;
  };

  const getInitials = (nom: string, prenom: string) => {
    return `${nom[0]}${prenom[0]}`.toUpperCase();
  };

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
        <BoutonAjouterJournalier
          directions={donneesReference.directions}
          services={donneesReference.services}
          projets={donneesReference.projets}
        />
        <BoutonAjouterEmploye
          postes={donneesReference.postes}
          nationalites={donneesReference.nationalites}
          directions={donneesReference.directions}
          services={donneesReference.services}
          employes={donneesReference.employes}
          projets={donneesReference.projets}
        />
      </div>

      {/* Filters */}
      <FiltresEmployesClient
        recherche={recherche}
        typeMainOeuvre={typeMainOeuvre}
        directionId={directionId}
        statutDossier={statutDossier}
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
                  Nom Employé
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Matricule
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Poste
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Type de main d'œuvre
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Direction
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Statut
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {employes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    Aucun employé trouvé
                  </td>
                </tr>
              ) : (
                employes.map((employe) => (
                  <tr
                    key={employe.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <input type="checkbox" className="rounded border-border cursor-pointer" />
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/employes/${employe.id}`} className="flex items-center gap-3 hover:opacity-80">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: '#13850b' }}>
                          {getInitials(employe.nom, employe.prenom)}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {employe.nom} {employe.prenom}
                          </div>
                          <div className="text-xs text-muted-foreground">{employe.email || "—"}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                      {employe.matricule}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {employe.posteActuel?.libelle || "—"}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {employe.typeMainOeuvre === "PERMANENT" ? (
                        <Badge className="bg-primary-soft text-primary">Permanent</Badge>
                      ) : (
                        <Badge className="bg-warning-soft text-warning">Journalier</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {employe.posteActuel?.direction.libelle || "—"}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(employe)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <BoutonModifierEmploye
                          employeId={employe.id}
                          postes={donneesReference.postes}
                          nationalites={donneesReference.nationalites}
                          directions={donneesReference.directions}
                          services={donneesReference.services}
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
            Affichage de {(page - 1) * 25 + 1} à {Math.min(page * 25, total)} sur {total} employé{total > 1 ? "s" : ""}
          </div>

          {pages > 1 && (
            <div className="flex items-center gap-2">
              <Link
                href={`/employes?page=${page - 1}`}
                className={`p-2 hover:bg-background rounded-lg transition-colors ${
                  page === 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <ChevronDown className="size-4 rotate-90 text-muted-foreground" />
              </Link>

              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Link
                    key={pageNum}
                    href={`/employes?page=${pageNum}`}
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
                href={`/employes?page=${page + 1}`}
                className={`p-2 hover:bg-background rounded-lg transition-colors ${
                  page === pages ? "pointer-events-none opacity-50" : ""
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
