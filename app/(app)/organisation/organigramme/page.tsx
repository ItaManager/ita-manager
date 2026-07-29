import { Suspense } from "react";
import { VueOrganigramme } from "./_components/vue-organigramme";
import { SqueletteOrganigramme } from "./_components/squelette-organigramme";

export const metadata = {
  title: "Organigramme — ITA Manager",
};

export default function PageOrganigramme() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Organigramme</h1>
        <p className="text-sm text-muted-foreground">
          Vue d'ensemble de la structure organisationnelle
        </p>
      </div>

      <Suspense fallback={<SqueletteOrganigramme />}>
        <VueOrganigramme />
      </Suspense>
    </div>
  );
}
