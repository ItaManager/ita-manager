import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statistiquesDFC, activiteRecente } from "@/lib/actions/pilotage";
import { TrendingUp, DollarSign, FileCheck, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function TableauDeBordDFC() {
  await verifierAccesPage("/pilotage/dfc");

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const dateFormatee = new Date().toLocaleDateString("fr-FR", dateOptions);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tableau de bord Direction Financière et Comptable</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dateFormatee.charAt(0).toUpperCase() + dateFormatee.slice(1)} — vue DFC
        </p>
      </div>

      <Suspense fallback={<SqueletteStatistiques />}>
        <StatistiquesDFC />
      </Suspense>

      <Suspense fallback={<SqueletteActivite />}>
        <ActiviteRecente />
      </Suspense>
    </div>
  );
}

async function StatistiquesDFC() {
  const stats = await statistiquesDFC();

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant);
  };

  const cartes = [
    {
      titre: "MASSE SALARIALE",
      valeur: formatMontant(stats.masseSalariale),
      description: "masse salariale mensuelle",
      icon: DollarSign,
      lien: "/paie",
      disponible: false,
      moduleManquant: "M7",
    },
    {
      titre: "PÉRIODES À VALIDER",
      valeur: stats.periodesAValider,
      description: "périodes de paie à valider",
      icon: FileCheck,
      lien: "/paie",
      disponible: false,
      moduleManquant: "M7",
    },
    {
      titre: "DÉROGATIONS EN ATTENTE",
      valeur: stats.derogationsEnAttente,
      description: "dérogations nécessitant validation",
      icon: AlertCircle,
      lien: "/derogations",
      disponible: false,
      moduleManquant: "M4",
    },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {cartes.map((carte) => {
          const Icone = carte.icon;
          const contenu = (
            <Card className="opacity-60">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{carte.titre}</CardTitle>
                <Icone className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{carte.valeur}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Disponible avec {carte.moduleManquant}
                </p>
              </CardContent>
            </Card>
          );

          return <div key={carte.titre}>{contenu}</div>;
        })}
      </div>

      <Card className="border-info-border bg-info-soft/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="size-5 text-info" />
            Statistiques DFC en attente de développement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les statistiques de la Direction Financière et Comptable seront disponibles une fois les modules
            suivants implémentés :
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                M4
              </Badge>
              <span className="text-muted-foreground">Gestion de la rémunération (dérogations)</span>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                M7
              </Badge>
              <span className="text-muted-foreground">Paie (masse salariale, périodes à valider)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}

async function ActiviteRecente() {
  const evenements = await activiteRecente(8);

  if (evenements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="size-4" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center text-muted-foreground py-4">
            Aucune activité récente à afficher.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="size-4" />
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {evenements.map((evt) => (
          <div key={evt.id} className="flex items-start justify-between border-b last:border-0 pb-3 last:pb-0">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{evt.entite}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">
                {evt.commentaire || evt.action}
              </div>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
              {format(new Date(evt.survenuLe), "d MMM HH:mm", { locale: fr })}
            </div>
          </div>
        ))}

        <Link href="/journal" className="block text-center pt-2">
          <button className="text-sm text-primary hover:underline">
            Voir tout le journal d'audit
          </button>
        </Link>
      </CardContent>
    </Card>
  );
}

function SqueletteStatistiques() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="h-4 bg-muted rounded w-24" />
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-muted rounded w-32 mb-2" />
            <div className="h-3 bg-muted rounded w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SqueletteActivite() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-5 bg-muted rounded w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-24 mb-1" />
              <div className="h-3 bg-muted rounded w-48" />
            </div>
            <div className="h-3 bg-muted rounded w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
