import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { ListeRoles } from "./_components/liste-roles";

export const metadata = {
  title: "Gestion des rôles — ITA Manager",
};

export default async function RolesPage() {
  await verifierAccesPage("/admin/roles");

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Gestion des rôles et permissions</h1>
        <p className="text-sm text-muted-foreground">
          Créer des rôles personnalisés et assigner des permissions spécifiques
        </p>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <ListeRoles />
      </Suspense>
    </div>
  );
}
