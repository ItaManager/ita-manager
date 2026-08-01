import { listerPrixFournisseur } from "@/lib/actions/achats";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { FormulairePrix } from "./_components/formulaire-prix";

export default async function PageBordereauPrix() {
  await verifierAccesPage("/achats/articles");
  const prix = await listerPrixFournisseur();

  return (
    <div className="flex min-h-screen flex-col">
      {/* En-tête */}
      <header className="bandeau sticky top-0 z-10 border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Bordereau de prix et Fournisseurs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Référentiel des articles, unités et prix fournisseurs
        </p>
      </header>

      {/* Contenu */}
      <main className="flex-1 px-6 py-6">
        {/* Formulaire d'ajout */}
        <div className="mb-6 rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Ajouter un prix fournisseur</h2>
          <FormulairePrix />
        </div>

        {/* Tableau des prix */}
        <div className="rounded-lg border bg-card">
          <div className="bandeau border-b px-6 py-3">
            <h2 className="text-lg font-semibold">
              Bordereau de prix ({prix.length})
            </h2>
          </div>

          {prix.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aucun prix enregistré.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Utilisez le formulaire ci-dessus pour ajouter un premier prix.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tabulaire w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Article
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Unité
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Fournisseur
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Prix HT (FCFA)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {prix.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-6 py-3 text-sm">
                        {p.article.designation}
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">
                        {p.article.unite.libelle}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {p.fournisseur.nom}
                      </td>
                      <td className="montant px-6 py-3 text-right text-sm font-medium">
                        {Number(p.prixHT).toLocaleString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
