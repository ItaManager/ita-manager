import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, Info, ExternalLink } from "lucide-react";
import Link from "next/link";
import { verifierAccesPage } from "@/lib/auth/page-access";

export const metadata = {
  title: "Aide — ITA Manager",
};

export default async function AidePage() {
  await verifierAccesPage("/aide");
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="size-6" />
          Aide
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Documentation et guides d'utilisation
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Modules disponibles</CardTitle>
            <CardDescription>
              ITA Manager est organisé en modules fonctionnels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm mb-2">M0 — Socle (v0.1.1)</h3>
                <p className="text-sm text-muted-foreground">
                  Authentification, double authentification TOTP, verrouillage de session,
                  rôles et permissions, journal d'audit
                </p>
              </div>

              <div>
                <h3 className="font-medium text-sm mb-2">M1 — Organisation (v0.2.0)</h3>
                <p className="text-sm text-muted-foreground">
                  Structure organisationnelle : 4 directions, 8 services, 30 postes.
                  Organigramme hiérarchique et contrôle de cohérence.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-sm mb-2">M2 — Employés (v0.3.0)</h3>
                <p className="text-sm text-muted-foreground">
                  Gestion des employés permanents et journaliers, contrats, documents,
                  affectations. Vues globales : contrats à échéance, dossiers incomplets,
                  dérogations salariales.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-sm mb-2">M11 — Administration (v0.4.0)</h3>
                <p className="text-sm text-muted-foreground">
                  Paramètres applicatifs, journal d'audit avec export CSV, documentation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accès et permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-sm mb-2">Rôles applicatifs</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><strong>ADMIN</strong> : Accès complet au système</li>
                <li><strong>DG</strong> : Directeur Général</li>
                <li><strong>DRH</strong> : Direction des Ressources Humaines</li>
                <li><strong>RH</strong> : Service RH</li>
                <li><strong>DFC</strong> : Direction Financière et Comptable</li>
                <li><strong>DT</strong> : Direction Technique</li>
                <li><strong>CT</strong> : Conducteur de Travaux</li>
                <li><strong>CC</strong> : Chef de Chantier</li>
                <li><strong>CE</strong> : Chef d'Équipe</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">Obligation TOTP</h3>
              <p className="text-sm text-muted-foreground">
                La double authentification par application (TOTP) est obligatoire pour les
                rôles ADMIN, DG, DRH, DFC et DT. Elle est demandée à la première connexion
                après attribution du rôle.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">Verrouillage de session</h3>
              <p className="text-sm text-muted-foreground">
                Après 20 minutes d'inactivité, la session est verrouillée. Un mot de passe
                (pas le code TOTP) est requis pour déverrouiller.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Journalisation et audit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Toutes les décisions opposables sont enregistrées dans le{" "}
              <Link href="/journal" className="underline font-medium">
                journal d'audit
              </Link>{" "}
              : créations, modifications, validations, refus, archivages.
            </p>

            <Alert>
              <Info className="size-4" />
              <AlertDescription className="text-sm">
                <strong>Aucune donnée sensible n'est journalisée</strong> : pas de
                salaires, de RIB, de numéros CNPS ni de pièces médicales. Seuls les
                identifiants et les actions sont enregistrés.
              </AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground">
              Le journal est en ajout seul — aucune action ne permet de le modifier ni de
              le supprimer. Conservation : 5 ans.
            </p>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <ExternalLink className="size-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground">
                Pour toute question technique ou signalement de problème, contactez
                l'administrateur système à{" "}
                <a
                  href="mailto:armelgnakpa7@gmail.com"
                  className="underline font-medium"
                >
                  armelgnakpa7@gmail.com
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
