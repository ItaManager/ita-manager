import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { obtenirConsommationParVehicule } from "@/lib/actions/carburant";
import { TableauConsommation } from "../_components/tableau-consommation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel } from "lucide-react";

interface PageRapportCarburantProps {
  searchParams: Promise<{
    annee?: string;
  }>;
}

export const metadata = {
  title: "Rapport Consommation Carburant — ITA Manager",
};

async function DonneesConsommation({ annee }: { annee: number }) {
  const resultat = await obtenirConsommationParVehicule({ annee });

  return (
    <TableauConsommation
      donnees={resultat.donnees}
      annee={resultat.annee}
      totalEnregistrements={resultat.totalEnregistrements}
      quantiteTotale={resultat.quantiteTotale}
    />
  );
}

export default async function PageRapportCarburant({
  searchParams,
}: PageRapportCarburantProps) {
  await verifierAccesPage("/assistanat/carburant");

  const params = await searchParams;
  const annee = params.annee ? parseInt(params.annee) : new Date().getFullYear();

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Fuel className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">
                Carburant - Quantité totale / Mois / Véhicule
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Rapport de consommation par véhicule et par mois
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="text-center py-8 text-muted-foreground">
                Chargement des données de consommation...
              </div>
            }
          >
            <DonneesConsommation annee={annee} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
