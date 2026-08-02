import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statistiquesDRH, activiteRecente } from "@/lib/actions/pilotage";
import { TrendingUp, Users, FileText, Calendar, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function TableauDeBordDRH() {
  await verifierAccesPage("/pilotage/drh");

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
        <h1 className="text-2xl font-semibold">Tableau de bord Direction des Ressources Humaines</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dateFormatee.charAt(0).toUpperCase() + dateFormatee.slice(1)} — vue DRH
        </p>
      </div>

      <Suspense fallback={<SqueletteStatistiques />}>
        <StatistiquesDRH />
      </Suspense>

      <Suspense fallback={<SqueletteActivite />}>
        <ActiviteRecente />
      </Suspense>
    </div>
  );
}

async function StatistiquesDRH() {
  const stats = await statistiquesDRH();

  const cartes = [
    {
      titre: "EFFECTIF TOTAL",
      valeur: stats.effectifTotal,
      description: "employés actifs",
      icon: Users,
      lien: "/employes",
      disponible: true,
    },
    {
      titre: "DOSSIERS INCOMPLETS",
      valeur: stats.dossiersIncomplets,
      description: "dossiers nécessitant mise à jour",
      icon: FileText,
      lien: "/employes",
      disponible: false,
      moduleManquant: "M2",
    },
    {
      titre: "CONGÉS EN ATTENTE",
      valeur: stats.congesEnAttente,
      description: "demandes de congés à valider",
      icon: Calendar,
      lien: "/conges",
      disponible: false,
      moduleManquant: "M3",
    },
    {
      titre: "CONTRATS À ÉCHÉANCE",
      valeur: stats.contratsAEcheance,
      description: "contrats arrivant à terme",
      icon: AlertTriangle,
      lien: "/employes",
      disponible: false,
      moduleManquant: "M2",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cartes.map((carte) => {
        const Icone = carte.icon;
        const contenu = (
          <Card
            className={carte.disponible ? "hover:border-primary transition-colors cursor-pointer" : "opacity-60"}
          >
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{carte.titre}</CardTitle>
              <Icone className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{carte.valeur}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {carte.disponible ? carte.description : `Disponible avec ${carte.moduleManquant}`}
              </p>
            </CardContent>
          </Card>
        );

        return carte.disponible ? (
          <Link key={carte.titre} href={carte.lien}>
            {contenu}
          </Link>
        ) : (
          <div key={carte.titre}>{contenu}</div>
        );
      })}
    </div>
  );
}

async function ActiviteRecente() {
  const evenements = await activiteRecente(8);

  if (evenements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
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
