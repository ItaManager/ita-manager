import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { FileText } from "lucide-react";
import { ListeReleves } from "./_components/liste-releves";

export const metadata = {
  title: "Relevés d'activité — ITA Manager",
};

export default async function RelevesPage() {
  await verifierAccesPage("/releves");

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <FileText className="size-6" />
            Relevés d'activité
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pointages chantier et rapports journaliers
          </p>
        </div>

        {/* TODO: Bouton nouveau relevé */}
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <ListeReleves />
      </Suspense>
    </div>
  );
}
