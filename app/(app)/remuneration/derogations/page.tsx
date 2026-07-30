import { verifierAccesPage } from "@/lib/auth/page-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, FileText } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Dérogations salariales — ITA Manager",
};

export default async function DerogationsPage() {
  await verifierAccesPage("/remuneration/derogations");

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Dérogations salariales
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Circuit de validation des salaires hors grille
        </p>
      </div>

      <div className="space-y-6">
        <Alert>
          <Info className="size-4" />
          <AlertTitle>Gestion intégrée à la fiche employé</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>
              Les dérogations salariales sont gérées directement depuis la{" "}
              <Link href="/employes" className="underline font-medium">
                fiche employé
              </Link>
              .
            </p>
            <p className="text-sm">
              Lors de la saisie d'un salaire hors de la fourchette du niveau,
              une demande de dérogation est automatiquement créée et envoyée à
              la Direction Financière pour validation.
            </p>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Règles de gestion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-sm mb-2">
                1. Déclenchement automatique
              </h3>
              <p className="text-sm text-muted-foreground">
                Toute saisie de salaire en dehors de la fourchette du niveau
                crée une <code className="bg-muted px-1 rounded">DerogationSalariale</code>{" "}
                avec statut <code className="bg-muted px-1 rounded">EN_ATTENTE</code>.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">
                2. Motif obligatoire (40 caractères minimum)
              </h3>
              <p className="text-sm text-muted-foreground">
                La RH doit renseigner un motif substantiel : « Recrutement en tension,
                seul candidat titulaire du CACES 4 » — jamais « Décision de la direction ».
              </p>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">
                3. Validation DFC requise
              </h3>
              <p className="text-sm text-muted-foreground">
                Seule la Direction Financière (rôle <code className="bg-muted px-1 rounded">DFC</code>)
                peut valider ou refuser une dérogation via{" "}
                <code className="bg-muted px-1 rounded">deciderDerogation()</code>.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">
                4. Blocage export paie
              </h3>
              <p className="text-sm text-muted-foreground text-destructive font-medium">
                ⚠️ Tant que la dérogation est en attente, l'employé est{" "}
                <strong>exclu des exports de paie</strong>. C'est le verrou qui
                empêche un salaire non validé de partir en paie.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">
                5. Journalisation
              </h3>
              <p className="text-sm text-muted-foreground">
                Toute décision (validation/refus) est journalisée dans{" "}
                <code className="bg-muted px-1 rounded">JournalEvenement</code> avec
                le commentaire de la DFC.
              </p>
            </div>
          </CardContent>
        </Card>

        <Alert className="border-muted">
          <Info className="size-4" />
          <AlertDescription className="text-sm">
            <strong>Actions serveur disponibles :</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <code className="bg-muted px-1 rounded text-xs">demanderDerogation()</code> — Permission{" "}
                <code className="bg-muted px-1 rounded text-xs">employe:modifier</code>
              </li>
              <li>
                <code className="bg-muted px-1 rounded text-xs">deciderDerogation()</code> — Permission{" "}
                <code className="bg-muted px-1 rounded text-xs">derogation:valider</code> (DFC uniquement)
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
