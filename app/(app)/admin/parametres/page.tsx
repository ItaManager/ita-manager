import { Suspense } from "react";
import { ListeParametres } from "./_components/liste-parametres";
import { SqueletteParametres } from "./_components/squelette-parametres";
import { verifierAccesPage } from "@/lib/auth/page-access";

export const metadata = {
  title: "Paramètres système — ITA Manager",
};

export default async function PageParametres() {
  await verifierAccesPage("/admin/parametres");

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Paramètres système
        </h1>
        <p className="text-sm text-muted-foreground">
          Configuration globale de l'application
        </p>
      </div>

      <Suspense fallback={<SqueletteParametres />}>
        <ListeParametres />
      </Suspense>
    </div>
  );
}
