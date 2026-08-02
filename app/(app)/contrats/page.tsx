import { Suspense } from "react";
import { exigerPermission } from "@/lib/auth/guard";
import { PERMISSIONS } from "@/lib/auth/guard";
import { listerTousContrats } from "@/lib/actions/employes";
import { TableauContrats } from "./_components/tableau-contrats";
import { Skeleton } from "@/components/ui/skeleton";

type SearchParams = Promise<{
  page?: string;
  recherche?: string;
  typeContrat?: string;
  echeance?: string;
}>;

export const metadata = {
  title: "Contrats — ITA Manager",
};

export default async function PageContrats({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await exigerPermission(PERMISSIONS["employe:lire"].code);

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const recherche = params.recherche;
  const typeContrat = params.typeContrat;
  const echeance = params.echeance;

  // Récupérer tous les contrats
  const tousLesContrats = await listerTousContrats();

  // Filtrage côté serveur
  let contratsFiltrés = tousLesContrats.filter((c) => c.actif); // Contrats actifs uniquement

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contrats</h1>
          <p className="text-muted-foreground mt-2">
            {total} contrat{total > 1 ? "s" : ""} actif{total > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <Suspense fallback={<SqueletteTableau />}>
        <TableauContrats
          contrats={contratsPagines}
          total={total}
          pages={pages}
          pageActuelle={page}
        />
      </Suspense>
    </div>
  );
}

function SqueletteTableau() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
