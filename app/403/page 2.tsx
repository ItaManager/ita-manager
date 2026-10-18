import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { BlocIdentite } from "@/components/bloc-identite";

export const metadata = {
  title: "Accès refusé — ITA Manager",
};

export default function Page403() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <BlocIdentite />

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert
              className="size-8 text-destructive"
              aria-hidden="true"
            />
          </div>
          <CardTitle className="text-2xl">Accès refusé</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Vous ne disposez pas des permissions nécessaires pour accéder à
            cette page.
          </p>

          <p className="text-xs text-muted-foreground">
            Si vous pensez qu'il s'agit d'une erreur, contactez votre
            administrateur pour demander l'attribution des permissions requises.
          </p>

          <div className="pt-4">
            <Button asChild className="gap-2">
              <Link href="/organisation/organigramme">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
