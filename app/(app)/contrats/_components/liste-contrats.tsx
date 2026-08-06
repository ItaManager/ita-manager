import { listerTousContrats, listerEmployes } from "@/lib/actions/employes";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown } from "lucide-react";
import Link from "next/link";
import { BoutonNouveauContrat } from "./bouton-nouveau-contrat";
import { FiltresContratsClient } from "./filtres-contrats-client";
import { ListeContratsClient } from "./liste-contrats-client";

interface ListeContratsProps {
  page: number;
  recherche?: string;
  typeContrat?: string;
  echeance?: string;
  statut?: string;
}

export async function ListeContrats({
  page,
  recherche,
  typeContrat,
  echeance,
  statut = "actifs",
}: ListeContratsProps) {
  // Récupérer tous les contrats
  const tousLesContrats = await listerTousContrats();

  // Récupérer la liste des employés pour le bouton Nouveau contrat
  const { items: employes } = await listerEmployes({ page: 1 });

  // Compter les contrats actifs pour le message
  const contratsActifs = tousLesContrats.filter((c) => c.actif);

  // Filtrage côté serveur par statut
  let contratsFiltrés = statut === "tous" ? tousLesContrats : contratsActifs;

  // Filtre par type
  if (typeContrat && typeContrat !== "tous") {
    contratsFiltrés = contratsFiltrés.filter((c) => c.typeContrat === typeContrat);
  }

  // Filtre par échéance
  if (echeance && echeance !== "tous") {
    if (echeance === "30j") {
      contratsFiltrés = contratsFiltrés.filter((c) => c.niveauAlerte === "danger");
    } else if (echeance === "60j") {
      contratsFiltrés = contratsFiltrés.filter(
        (c) => c.niveauAlerte === "warning" || c.niveauAlerte === "danger"
      );
    }
  }

  // Filtre par recherche (matricule ou nom)
  if (recherche) {
    const rechercheNormalisee = recherche.toLowerCase();
    contratsFiltrés = contratsFiltrés.filter(
      (c) =>
        c.employe.matricule.toLowerCase().includes(rechercheNormalisee) ||
        c.employe.nom.toLowerCase().includes(rechercheNormalisee) ||
        c.employe.prenom.toLowerCase().includes(rechercheNormalisee)
    );
  }

  // Tri par échéance croissante (CDD expirant bientôt en premier)
  contratsFiltrés.sort((a, b) => {
    // CDD avec date de fin avant tout
    if (a.dateFin && !b.dateFin) return -1;
    if (!a.dateFin && b.dateFin) return 1;

    // Si les deux ont une date de fin, trier par date
    if (a.dateFin && b.dateFin) {
      return new Date(a.dateFin).getTime() - new Date(b.dateFin).getTime();
    }

    // Sinon, trier par type (CDD avant CDI)
    if (a.typeContrat === "CDD" && b.typeContrat !== "CDD") return -1;
    if (a.typeContrat !== "CDD" && b.typeContrat === "CDD") return 1;

    return 0;
  });

  // Pagination
  const parPage = 25;
  const total = contratsFiltrés.length;
  const pages = Math.ceil(total / parPage);
  const debut = (page - 1) * parPage;
  const fin = debut + parPage;
  const contratsPagines = contratsFiltrés.slice(debut, fin);


  return (
    <>
      {/* Actions Header */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-4">
          {statut === "actifs" ? (
            <Button
              variant="outline"
              asChild
              className="gap-2 h-12 px-6 text-base border-2 hover:bg-muted hover:border-primary transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <Link href="/contrats?statut=tous">
                Afficher tous les contrats
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              asChild
              className="gap-2 h-12 px-6 text-base border-2 hover:bg-muted hover:border-primary transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <Link href="/contrats?statut=actifs">
                Afficher uniquement les actifs
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-2 h-12 px-6 text-base border-2 hover:bg-muted hover:border-primary transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <Download className="size-5" />
            Télécharger
          </Button>
          <BoutonNouveauContrat employes={employes} />
        </div>
      </div>

      {/* Filters */}
      <FiltresContratsClient
        recherche={recherche}
        typeContrat={typeContrat}
        echeance={echeance}
      />

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Employé
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Début
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Fin
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Échéance
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <ListeContratsClient contrats={contratsPagines} />
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <div className="text-sm text-muted-foreground">
            Affichage de {(page - 1) * parPage + 1} à {Math.min(page * parPage, total)} sur {total} contrat{total > 1 ? "s" : ""}
          </div>

          {pages > 1 && (
            <div className="flex items-center gap-2">
              <Link
                href={`/contrats?page=${page - 1}${statut === "tous" ? "&statut=tous" : ""}`}
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
                    href={`/contrats?page=${pageNum}${statut === "tous" ? "&statut=tous" : ""}`}
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
                href={`/contrats?page=${page + 1}${statut === "tous" ? "&statut=tous" : ""}`}
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
