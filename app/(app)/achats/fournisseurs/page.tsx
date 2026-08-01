import { listerTousFournisseurs } from "@/lib/actions/achats";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { BoutonNouveauFournisseur } from "./_components/bouton-nouveau-fournisseur";
import { LigneFournisseur } from "./_components/ligne-fournisseur";

export const metadata = {
  title: "Fournisseurs — ITA Manager",
};

export default async function PageFournisseurs() {
  await verifierAccesPage("/achats/fournisseurs");
  const fournisseurs = await listerTousFournisseurs();

  return (
    <div className="flex min-h-screen flex-col">
      {/* En-tête */}
      <header className="bandeau sticky top-0 z-10 border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Fournisseurs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Identité des sociétés et coordonnées de paiement
        </p>
      </header>

      {/* Contenu */}
      <main className="flex-1 px-6 py-6">
        {/* Tableau des fournisseurs */}
        <div className="rounded-lg border bg-card">
          <div className="bandeau flex items-center justify-between border-b px-6 py-3">
            <h2 className="text-lg font-semibold">
              Fournisseurs ({fournisseurs.length})
            </h2>
            <BoutonNouveauFournisseur />
          </div>

          {fournisseurs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aucun fournisseur enregistré.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Utilisez le bouton &quot;Nouveau fournisseur&quot; pour commencer.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tabulaire w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Numéro Wave
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fournisseurs.map((fournisseur) => (
                    <LigneFournisseur
                      key={fournisseur.id}
                      fournisseur={fournisseur}
                    />
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
