import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { FolderKanban } from "lucide-react";
import { ListeProjets } from "./_components/liste-projets";
import { BoutonNouveauProjet } from "./_components/bouton-nouveau-projet";

export const metadata = {
  title: "Projets — ITA Manager",
};

export default async function ProjetsPage() {
  await verifierAccesPage("/projets");

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <FolderKanban className="size-6" />
            Projets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion des chantiers et suivi de l'avancement
          </p>
        </div>

        <BoutonNouveauProjet />
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <ListeProjets />
      </Suspense>
    </div>
  );
}
