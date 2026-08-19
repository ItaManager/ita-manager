import { verifierAccesPage } from "@/lib/auth/page-access";
import { listerProjets } from "@/lib/actions/projets";
import { FormulaireNouveauReleve } from "./_components/formulaire-nouveau-releve";
import { FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Nouveau relevé — ITA Manager",
};

export default async function NouveauRelevePage() {
  await verifierAccesPage("/releves/nouveau");

  // Charger la liste des projets
  const projets = await listerProjets();

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      {/* En-tête */}
      <div className="mb-6">
        <Link href="/releves">
          <Button variant="ghost" size="sm" className="mb-3 gap-2">
            <ChevronLeft className="size-4" />
            Retour aux relevés
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="flex size-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#13850b" }}
          >
            <FileText className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Nouveau relevé d'activité</h1>
            <p className="text-sm text-muted-foreground">
              Créer un relevé journalier de chantier
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <FormulaireNouveauReleve
        projets={projets.map((p) => ({
          id: p.id,
          code: p.code,
          nom: p.nom,
        }))}
      />
    </div>
  );
}
