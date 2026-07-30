import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { listerParametres } from "@/lib/actions/administration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Info } from "lucide-react";
import { FormulairesParametres } from "./_components/formulaires-parametres";

export const metadata = {
  title: "Paramètres — ITA Manager",
};

export default async function ParametresPage() {
  await verifierAccesPage("/parametres");

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Settings className="size-6" />
          Paramètres
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configuration de l'application regroupée par domaine
        </p>
      </div>

      <Suspense fallback={<SqueletteParametres />}>
        <ListeParametres />
      </Suspense>
    </div>
  );
}

async function ListeParametres() {
  const groupes = await listerParametres();

  // Ordre des domaines
  const ordreGroupes = ["GENERAL", "SECURITE", "CONGES", "PAIE", "NOTIFICATIONS"];
  const libellesGroupes: Record<string, { titre: string; description: string }> = {
    GENERAL: {
      titre: "Général",
      description: "Nom de l'entreprise, logo, coordonnées",
    },
    SECURITE: {
      titre: "Sécurité",
      description: "Délai de verrouillage, obligation TOTP par rôle",
    },
    CONGES: {
      titre: "Congés",
      description: "Dotations, majorations, plafond de report, jours fériés",
    },
    PAIE: {
      titre: "Paie",
      description: "Diviseur du taux journalier, heures supplémentaires",
    },
    NOTIFICATIONS: {
      titre: "Notifications",
      description: "Délais de relance par niveau d'urgence",
    },
  };

  const groupesOrdonnes = ordreGroupes
    .filter((groupe) => groupes[groupe] && groupes[groupe].length > 0)
    .map((groupe) => ({
      code: groupe,
      ...libellesGroupes[groupe],
      parametres: groupes[groupe],
    }));

  // Ajouter les groupes non prévus (futurs modules)
  Object.keys(groupes).forEach((groupe) => {
    if (!ordreGroupes.includes(groupe) && groupes[groupe].length > 0) {
      groupesOrdonnes.push({
        code: groupe,
        titre: groupe.charAt(0) + groupe.slice(1).toLowerCase(),
        description: "",
        parametres: groupes[groupe],
      });
    }
  });

  if (groupesOrdonnes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Info className="size-12 mx-auto text-muted-foreground opacity-50 mb-3" />
          <p className="text-sm text-muted-foreground">
            Aucun paramètre configurable pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groupesOrdonnes.map((groupe) => (
        <Card key={groupe.code}>
          <CardHeader>
            <CardTitle>{groupe.titre}</CardTitle>
            {groupe.description && (
              <CardDescription>{groupe.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <FormulairesParametres parametres={groupe.parametres} />
          </CardContent>
        </Card>
      ))}

      <Card className="border-muted">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="size-4 text-muted-foreground mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Toute modification de paramètre est journalisée</strong> avec
                l'ancienne et la nouvelle valeur dans le journal d'audit.
              </p>
              <p>
                Certains paramètres (format du matricule, codes de rôle) ne peuvent pas
                être modifiés sans intervention technique pour éviter de casser les
                données existantes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SqueletteParametres() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2].map((j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
