import { Suspense } from "react";
import { ListeDemandesAValider } from "./_components/liste-demandes-a-valider";
import { verifierAccesPage } from "@/lib/auth/page-access";

export const metadata = {
  title: "Demandes à valider — ITA Manager",
};

export default async function DemandesAValiderPage() {
  // Pas de permission spécifique — accessible à tous
  // L'autorisation se fait au niveau de la donnée dans listerDemandesAValider()
  await verifierAccesPage("/conges/a-valider");

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Demandes à valider
        </h1>
        <p className="text-sm text-muted-foreground">
          Demandes d'absence de vos collaborateurs
        </p>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <ListeDemandesAValider />
      </Suspense>
    </div>
  );
}
