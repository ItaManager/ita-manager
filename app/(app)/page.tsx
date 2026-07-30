import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TableauDeBord() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Date du jour
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const dateFormatee = new Date().toLocaleDateString("fr-FR", dateOptions);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dateFormatee.charAt(0).toUpperCase() + dateFormatee.slice(1)} — vue
          d'ensemble du personnel ITA SARL
        </p>
      </div>

      {/* Grille d'indicateurs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Effectif total */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              EFFECTIF TOTAL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">22</div>
            <p className="mt-1 text-xs text-muted-foreground">
              +3 ce trimestre
            </p>
          </CardContent>
        </Card>

        {/* Congés à valider */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CONGÉS À VALIDER
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="mt-1 text-xs text-muted-foreground">
              congés et permissions
            </p>
          </CardContent>
        </Card>

        {/* Paie chantier */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              PAIE CHANTIER
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2</div>
            <p className="mt-1 text-xs text-muted-foreground">
              clôtures et validations
            </p>
          </CardContent>
        </Card>

        {/* Contrats à échéance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CONTRATS À ÉCHÉANCE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">5</div>
            <p className="mt-1 text-xs text-muted-foreground">
              sous 120 jours
            </p>
          </CardContent>
        </Card>

        {/* Dérogations salariales */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              DÉROGATIONS SALARIALES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1</div>
            <p className="mt-1 text-xs text-muted-foreground">
              à valider par la DFC
            </p>
          </CardContent>
        </Card>

        {/* Masse salariale */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MASSE SALARIALE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">14 580 000 F</div>
            <p className="mt-1 text-xs text-muted-foreground">
              mensuelle brute
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Effectif par direction */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Effectif par direction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Direction Générale</span>
              <span className="font-medium">1</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-blue-600"
                style={{ width: "4.5%" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Direction Financière et Comptable</span>
              <span className="font-medium">3</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-blue-600"
                style={{ width: "13.6%" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Direction Technique</span>
              <span className="font-medium">12</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-blue-600"
                style={{ width: "54.5%" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Direction Administrative et RH</span>
              <span className="font-medium">6</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-blue-600"
                style={{ width: "27.3%" }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chantiers et cycles de paie */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Chantiers et cycles de paie</CardTitle>
          <button className="text-sm text-blue-600 hover:underline">
            Tout voir
          </button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between border-b pb-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 size-2 rounded-full bg-blue-600" />
              <div>
                <div className="text-sm font-medium">Adduction Bouaké Nord</div>
                <div className="text-xs text-muted-foreground">
                  cycle 16 | clôture le 21/07/2026
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              J–4
            </Badge>
          </div>

          <div className="flex items-start justify-between border-b pb-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 size-2 rounded-full bg-green-600" />
              <div>
                <div className="text-sm font-medium">Réhabilitation voirie Yopougon</div>
                <div className="text-xs text-muted-foreground">
                  cycle 7 | clôture le 27/07/2026
                </div>
              </div>
            </div>
            <Badge variant="outline" className="border-amber-500 text-xs text-amber-700">
              à clôturer
            </Badge>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1 size-2 rounded-full bg-amber-600" />
              <div>
                <div className="text-sm font-medium">Assainissement Marcory Zone 4</div>
                <div className="text-xs text-muted-foreground">
                  cycle 30 | clôture le 30/08/2026
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              J–34
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Demandes à valider */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Demandes à valider</CardTitle>
          <button className="text-sm text-blue-600 hover:underline">
            Tout voir
          </button>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between border-b py-2">
            <div>
              <div className="text-sm font-medium">DIALLO Mariam</div>
              <div className="text-xs text-muted-foreground">
                Congé annuel · 12 j
              </div>
            </div>
            <Badge variant="outline" className="border-amber-500 text-xs text-amber-700">
              En attente
            </Badge>
          </div>

          <div className="flex items-center justify-between border-b py-2">
            <div>
              <div className="text-sm font-medium">KOFFI Alain</div>
              <div className="text-xs text-muted-foreground">
                Permission décès · 3 j 🔗 pièce jointe
              </div>
            </div>
            <Badge variant="outline" className="border-amber-500 text-xs text-amber-700">
              En attente
            </Badge>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium">N'GUESSAN Léa</div>
              <div className="text-xs text-muted-foreground">
                Congé maternité / paternité · 85 j 🔗 pièce jointe
              </div>
            </div>
            <Badge variant="outline" className="border-amber-500 text-xs text-amber-700">
              En attente
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Dossiers à compléter */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Dossiers à compléter</CardTitle>
          <button className="text-sm text-blue-600 hover:underline">
            Tout voir
          </button>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between border-b py-2">
            <div>
              <div className="text-sm font-medium">DIALLO Mariam</div>
              <div className="text-xs text-muted-foreground">Assistant QHSE</div>
            </div>
            <Badge variant="outline" className="text-xs text-amber-700">
              5 / 7 pièces
            </Badge>
          </div>

          <div className="flex items-center justify-between border-b py-2">
            <div>
              <div className="text-sm font-medium">N'GUESSAN Léa</div>
              <div className="text-xs text-muted-foreground">
                Chargé d'études et travaux
              </div>
            </div>
            <Badge variant="outline" className="text-xs text-amber-700">
              4 / 7 pièces
            </Badge>
          </div>

          <div className="flex items-center justify-between border-b py-2">
            <div>
              <div className="text-sm font-medium">GNAHORÉ Pascal</div>
              <div className="text-xs text-muted-foreground">Ouvrier</div>
            </div>
            <Badge variant="outline" className="text-xs text-amber-700">
              2 / 7 pièces
            </Badge>
          </div>

          <div className="flex items-center justify-between border-b py-2">
            <div>
              <div className="text-sm font-medium">ZADI Estelle</div>
              <div className="text-xs text-muted-foreground">Assistant RH</div>
            </div>
            <Badge variant="outline" className="text-xs text-amber-700">
              5 / 7 pièces
            </Badge>
          </div>

          <div className="flex items-center justify-between border-b py-2">
            <div>
              <div className="text-sm font-medium">BROU Kevin</div>
              <div className="text-xs text-muted-foreground">Relais QHSE</div>
            </div>
            <Badge variant="outline" className="text-xs text-amber-700">
              3 / 7 pièces
            </Badge>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium">AKA Rose</div>
              <div className="text-xs text-muted-foreground">Coursier</div>
            </div>
            <Badge variant="outline" className="text-xs text-amber-700">
              6 / 7 pièces
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
