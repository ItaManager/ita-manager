import { verifierAccesPage } from "@/lib/auth/page-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Rémunération — ITA Manager",
};

export default async function PaiePage() {
  await verifierAccesPage("/paie");

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="size-6" />
          Rémunération
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestion de la grille salariale et des dérogations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/remuneration/grille">
          <Card className="cursor-pointer hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-5" />
                Grille salariale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Fourchettes de rémunération par niveau hiérarchique (Direction, Cadre, Support, Opérationnel)
              </p>
              <ul className="mt-3 text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Version actuelle publiée</li>
                <li>Brouillons en cours</li>
                <li>Historique des versions</li>
              </ul>
            </CardContent>
          </Card>
        </Link>

        <Link href="/remuneration/derogations">
          <Card className="cursor-pointer hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="size-5" />
                Dérogations salariales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Validation des salaires hors grille par la Direction Financière
              </p>
              <ul className="mt-3 text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Demandes en attente</li>
                <li>Dérogations validées</li>
                <li>Dérogations refusées</li>
              </ul>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="mt-6 border-info bg-info-soft/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Principe :</strong> Tous les salaires doivent respecter la grille en vigueur.
            Les exceptions nécessitent une dérogation validée par la DFC.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
