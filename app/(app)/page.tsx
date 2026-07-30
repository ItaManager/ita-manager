import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statistiquesTableauDeBord, alertesTableauDeBord, activiteRecente } from "@/lib/actions/pilotage";
import { Users, Building2, Briefcase, FileText, AlertCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function TableauDeBord() {
  await verifierAccesPage("/");

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
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dateFormatee.charAt(0).toUpperCase() + dateFormatee.slice(1)} — vue d'ensemble ITA SARL
        </p>
      </div>

      <Suspense fallback={<SqueletteStatistiques />}>
        <Statistiques />
      </Suspense>

      <Suspense fallback={<SqueletteAlertes />}>
        <Alertes />
      </Suspense>

      <Suspense fallback={<SqueletteActivite />}>
        <ActiviteRecente />
      </Suspense>
    </div>
  );
}

async function Statistiques() {
  const stats = await statistiquesTableauDeBord();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Link href="/organisation/directions">
        <Card className="hover:border-primary transition-colors cursor-pointer">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">ORGANISATION</CardTitle>
            <Building2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.organisation.directions}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              directions · {stats.organisation.services} services · {stats.organisation.postes} postes
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/employes">
        <Card className="hover:border-primary transition-colors cursor-pointer">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">EMPLOYÉS</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.employes.actifs}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              actifs sur {stats.employes.total} au total
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/appels-offres">
        <Card className="hover:border-primary transition-colors cursor-pointer">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">APPELS D'OFFRES</CardTitle>
            <Briefcase className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appelsOffres.gagnes}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              gagnés · {stats.appelsOffres.soumis} soumis · taux {stats.appelsOffres.tauxReussite}%
            </p>
          </CardContent>
        </Card>
      </Link>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">UTILISATEURS</CardTitle>
          <FileText className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.systeme.utilisateursActifs}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            comptes actifs sur {stats.systeme.utilisateurs}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function Alertes() {
  const alertes = await alertesTableauDeBord();

  if (alertes.aoEnAttenteDecision === 0 && alertes.aoProchesEcheance === 0) {
    return null;
  }

  return (
    <Card className="border-warning-border bg-warning-soft/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="size-5 text-warning" />
          Éléments nécessitant attention
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alertes.aoEnAttenteDecision > 0 && (
          <Link href="/appels-offres?statut=VEILLE" className="block">
            <div className="flex items-center justify-between py-2 hover:bg-background rounded px-2 -mx-2 transition-colors">
              <span className="text-sm">Appels d'offres en attente de décision go/no-go</span>
              <Badge variant="outline" className="border-warning text-warning">
                {alertes.aoEnAttenteDecision}
              </Badge>
            </div>
          </Link>
        )}

        {alertes.aoProchesEcheance > 0 && (
          <Link href="/appels-offres" className="block">
            <div className="flex items-center justify-between py-2 hover:bg-background rounded px-2 -mx-2 transition-colors">
              <span className="text-sm">Appels d'offres proches de l'échéance (&lt; 15 jours)</span>
              <Badge variant="outline" className="border-warning text-warning">
                {alertes.aoProchesEcheance}
              </Badge>
            </div>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

async function ActiviteRecente() {
  const evenements = await activiteRecente(5);

  if (evenements.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="h-4 bg-muted rounded w-24" />
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-muted rounded w-16 mb-2" />
            <div className="h-3 bg-muted rounded w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SqueletteAlertes() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-5 bg-muted rounded w-48" />
      </CardHeader>
      <CardContent>
        <div className="h-4 bg-muted rounded w-full mb-2" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </CardContent>
    </Card>
  );
}

function SqueletteActivite() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-5 bg-muted rounded w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
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
