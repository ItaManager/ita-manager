import { listerEmployes } from "@/lib/actions/employes";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { TypeMainOeuvre } from "@prisma/client";
import { FiltresEmployesClient } from "./filtres-employes-client";
import { BoutonAjouterEmploye } from "./bouton-ajouter-employe";
import { BoutonAjouterJournalier } from "./bouton-ajouter-journalier";
import { BoutonModifierEmploye } from "./bouton-modifier-employe";
import { ActionsJournalier } from "./actions-journalier";
import { PaginationEmployes } from "./pagination-employes";

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
  limit: number;
  recherche?: string;
  directionId?: string;
  serviceId?: string;
  typeMainOeuvre?: TypeMainOeuvre;
  statutDossier?: "COMPLET" | "INCOMPLET";
  disponibilite?: "EN_MISSION" | "DISPONIBLE";
  donneesReference: DonneesReference;
  tab: "permanents" | "journaliers";
}

export async function ListeEmployes({
  page,
  limit,
  recherche,
  directionId,
  serviceId,
  typeMainOeuvre,
  statutDossier,
  disponibilite,
  donneesReference,
  tab,
}: ListeEmployesProps) {
  const { items: employes, total, pages } = await listerEmployes({
    page,
    recherche,
    directionId,
    serviceId,
    typeMainOeuvre,
    statutDossier,
    disponibilite,
  });

  // Calculer les compteurs pour les filtres
  const tousEmployes = await listerEmployes({});
  const counts = {
    total: tousEmployes.total,
    permanents: tousEmployes.items.filter((e) => e.typeMainOeuvre === "PERMANENT").length,
    journaliers: tousEmployes.items.filter((e) => e.typeMainOeuvre === "JOURNALIER").length,
    dossiersIncomplets: tousEmployes.items.filter((e) => e.completudeDossier < 100).length,
    sansAcces: tousEmployes.items.filter((e) => e.archiveLe !== null).length,
  };

  return (
    <div>
      {/* Filters */}
      <FiltresEmployesClient
        recherche={recherche}
        typeMainOeuvre={typeMainOeuvre}
        directionId={directionId}
        serviceId={serviceId}
        statutDossier={statutDossier}
        disponibilite={disponibilite}
        directions={donneesReference.directions}
        services={donneesReference.services}
        counts={counts}
        boutonAjout={
          tab === "permanents" ? (
            <BoutonAjouterEmploye
              postes={donneesReference.postes}
              nationalites={donneesReference.nationalites}
              directions={donneesReference.directions}
              services={donneesReference.services}
              employes={donneesReference.employes}
              projets={donneesReference.projets}
            />
          ) : (
            <BoutonAjouterJournalier
              directions={donneesReference.directions}
              services={donneesReference.services}
              projets={donneesReference.projets}
            />
          )
        }
      />

      {/* Table */}
      <div className="mt-6 bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                {tab === "permanents" ? (
                  <>
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
                      Direction
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Contrat
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      État du dossier
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Statut
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </>
                ) : (
                  <>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Nom
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Téléphone
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Compétence
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Taux actuel
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Dernière mission
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Statut
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-[280px]">
                      Actions
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {employes.length === 0 ? (
                <tr>
                  <td colSpan={tab === "permanents" ? 8 : 7} className="py-12 text-center text-muted-foreground">
                    Aucun {tab === "permanents" ? "employé permanent" : "journalier"} trouvé
                  </td>
                </tr>
              ) : (
                employes.map((employe) => (
                  <tr
                    key={employe.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    {tab === "permanents" ? (
                      <>
                        <td className="py-3 px-4">
                          <Link href={`/employes/${employe.id}`} className="hover:opacity-80">
                            <div className="font-medium text-sm">
                              {employe.nom} {employe.prenom}
                            </div>
                            <div className="text-xs text-muted-foreground">{employe.email || "—"}</div>
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                          {employe.matricule}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {employe.posteActuel?.libelle || "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {employe.posteActuel?.direction.libelle || "—"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <Badge variant="secondary">
                            {employe.contratActuel?.typeContrat || "—"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {employe.completudeDossier === 100 ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              Complet
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700">
                              Incomplet ({employe.completudeDossier}%)
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">
                            {!employe.archiveLe ? "Actif" : "Archivé"}
                          </Badge>
                        </td>
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
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4">
                          <Link href={`/employes/${employe.id}`} className="hover:opacity-80">
                            <div className="font-medium text-sm">
                              {employe.nom} {employe.prenom}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {employe.matricule}
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                          {employe.telephone || "—"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {employe.competenceActuelle ? (
                            <Badge variant="outline" className="font-normal">
                              {employe.competenceActuelle}
                            </Badge>
                          ) : (
                            <span className="text-orange-600 text-xs">⚠️ Non assignée</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                          {employe.tauxActuel
                            ? `${employe.tauxActuel.toLocaleString()} FCFA/j`
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {employe.derniereMission || "Aucune"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={!employe.archiveLe ? "default" : "secondary"}>
                            {!employe.archiveLe ? "Actif" : "Archivé"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <ActionsJournalier
                            employeId={employe.id}
                            employeNom={employe.nom}
                            employePrenom={employe.prenom}
                          />
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <PaginationEmployes total={total} page={page} limit={limit} />
      </div>
    </div>
  );
}
