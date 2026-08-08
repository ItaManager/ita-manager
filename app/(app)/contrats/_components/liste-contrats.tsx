import { listerTousContrats, listerEmployes } from "@/lib/actions/employes";
import { BarreRechercheContrats } from "./barre-recherche-contrats";
import { ListeContratsClient } from "./liste-contrats-client";
import { PaginationContrats } from "./pagination-contrats";

interface ListeContratsProps {
  page: number;
  limit: number;
  recherche?: string;
  typeContrat?: string;
  echeance?: string;
  statut?: string;
}

export async function ListeContrats({
  page,
  limit,
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

  // Compter pour les filtres
  const counts = {
    actifs: contratsActifs.length,
    cdd: tousLesContrats.filter((c) => c.typeContrat === "CDD" && c.actif).length,
    cdi: tousLesContrats.filter((c) => c.typeContrat === "CDI" && c.actif).length,
    expirant: contratsActifs.filter((c) => c.niveauAlerte === "danger").length,
    tous: tousLesContrats.length,
  };

  // Pagination
  const total = contratsFiltrés.length;
  const debut = (page - 1) * limit;
  const fin = debut + limit;
  const contratsPagines = contratsFiltrés.slice(debut, fin);

  return (
    <div className="bg-white rounded-xl border border-[#0000001a] p-6">
      {/* Barre de recherche et filtres */}
      <BarreRechercheContrats counts={counts} employes={employes} />

      {/* Table */}
      <div className="mt-6 rounded-xl border border-border overflow-hidden bg-card">
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
        <PaginationContrats total={total} page={page} limit={limit} />
      </div>
    </div>
  );
}
