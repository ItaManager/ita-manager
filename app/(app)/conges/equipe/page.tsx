import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { TableauSoldesEquipe } from "./_components/tableau-soldes-equipe";

export const metadata = {
  title: "Soldes de l'équipe — ITA Manager",
};

export default async function SoldesEquipePage() {
  // Accessible à tous les utilisateurs qui ont des collaborateurs
  await verifierAccesPage("/conges/equipe");

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Soldes de l'équipe
        </h1>
        <p className="text-sm text-muted-foreground">
          Suivi des soldes de congé de vos collaborateurs
        </p>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <TableauSoldesEquipe />
      </Suspense>
    </div>
  );
}
