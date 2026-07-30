import { Suspense } from "react";
import { ListeUtilisateurs } from "./_components/liste-utilisateurs";
import { SqueletteUtilisateurs } from "./_components/squelette-utilisateurs";
import { verifierAccesPage } from "@/lib/auth/page-access";

export const metadata = {
  title: "Utilisateurs — ITA Manager",
};

interface PageProps {
  searchParams: Promise<{
    recherche?: string;
    actifs?: string;
  }>;
}

export default async function PageUtilisateurs({ searchParams }: PageProps) {
  await verifierAccesPage("/admin/utilisateurs");
  const params = await searchParams;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Gestion des utilisateurs
        </h1>
        <p className="text-sm text-muted-foreground">
          Administration des comptes et des rôles
        </p>
      </div>

      <Suspense
        key={JSON.stringify(params)}
        fallback={<SqueletteUtilisateurs />}
      >
        <ListeUtilisateurs
          recherche={params.recherche}
          actifSeulement={params.actifs !== "false"}
        />
      </Suspense>
    </div>
  );
}
