import { verifierAccesPage } from "@/lib/auth/page-access";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listerPeriodesPaie } from "@/lib/actions/paie";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Calendar, FileText, DollarSign } from "lucide-react";
import { BoutonOuvrirPeriode } from "./_components/bouton-ouvrir-periode";

export const metadata = {
  title: "Paie chantier — ITA Manager",
};

const STATUT_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  OUVERTE: { label: "Ouverte", variant: "outline" },
  VALIDEE_RH: { label: "Validée RH", variant: "secondary" },
  VALIDEE_DT: { label: "Validée DT", variant: "secondary" },
  VALIDEE_DFC: { label: "Validée DFC", variant: "default" },
  CLOTUREE: { label: "Clôturée", variant: "default" },
  REFUSEE: { label: "Refusée", variant: "destructive" },
};

export default async function PaiePeriodesPage() {
  await verifierAccesPage("/paie");

  const periodes = await listerPeriodesPaie();

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="size-6" />
            Paie chantier
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Périodes de paie et circuit de validation
          </p>
        </div>
        <BoutonOuvrirPeriode />
      </div>

      {periodes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Aucune période de paie enregistrée
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ouvrez une période pour calculer la paie d'un chantier
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {periodes.map((periode) => {
            const statutInfo = STATUT_CONFIG[periode.statut] || {
              label: periode.statut,
              variant: "outline" as const,
            };

            return (
              <Link
                key={periode.id}
                href={`/paie/${periode.id}`}
                className="block transition-transform hover:scale-[1.01]"
              >
                <Card className="cursor-pointer hover:border-primary">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-3">
                              <Calendar className="size-5 text-muted-foreground" />
                              <h3 className="font-semibold text-lg">
                                {format(new Date(periode.dateDebut), "d MMM", { locale: fr })} →{" "}
                                {format(new Date(periode.dateFin), "d MMM yyyy", { locale: fr })}
                              </h3>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <p className="text-sm text-muted-foreground font-mono">
                                {periode.projet.code}
                              </p>
                              <span className="text-muted-foreground">•</span>
                              <p className="text-sm font-medium">{periode.projet.nom}</p>
                            </div>
                          </div>

                          <Badge variant={statutInfo.variant}>
                            {statutInfo.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                          {periode.nbLignes > 0 ? (
                            <div className="flex items-center gap-2">
                              <FileText className="size-4" />
                              <span>{periode.nbLignes} ligne{periode.nbLignes > 1 ? "s" : ""} de paie</span>
                            </div>
                          ) : (
                            <span className="text-warning">Aucune ligne de paie calculée</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
