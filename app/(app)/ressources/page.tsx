import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { Wrench } from "lucide-react";
import { ListeMateriel } from "./_components/liste-materiel";

export const metadata = {
  title: "Ressources et Matériel — ITA Manager",
};

export default async function RessourcesPage() {
  await verifierAccesPage("/ressources");

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Wrench className="size-6" />
            Ressources et Matériel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion du parc matériel et des affectations
          </p>
        </div>

        {/* TODO: Bouton nouveau matériel */}
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <ListeMateriel />
      </Suspense>
    </div>
  );
}
