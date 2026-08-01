import { listerDemandesAvecCalculs } from "@/lib/actions/achats";
import { TableauSuivi } from "./_components/tableau-suivi";
import { verifierAccesPage } from "@/lib/auth/page-access";

export default async function PageSuiviAchats() {
  await verifierAccesPage("/achats/suivi");
  const demandes = await listerDemandesAvecCalculs();

  return (
    <div className="flex min-h-screen flex-col">
      {/* En-tête */}
      <header className="bandeau sticky top-0 z-20 border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Suivi des demandes d'achat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vue d'ensemble du circuit de validation et des délais
        </p>
      </header>

      {/* Tableau */}
      <main className="flex-1 px-6 py-6">
        <TableauSuivi demandes={demandes} />
      </main>
    </div>
  );
}
