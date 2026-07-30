import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { listerEmployes } from "@/lib/actions/employes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, AlertCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Documents — ITA Manager",
};

export default async function DocumentsPage() {
  await verifierAccesPage("/documents");

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <FileText className="size-6" />
          Documents
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Suivi de complétude des dossiers employés
        </p>
      </div>

      <Suspense fallback={<SqueletteDocuments />}>
        <ListeDossiersIncomplets />
      </Suspense>
    </div>
  );
}

async function ListeDossiersIncomplets() {
  const { items: employes } = await listerEmployes({ statutDossier: "INCOMPLET" });
  const nbIncomplets = employes.length;

  return (
    <div className="space-y-6">
      {nbIncomplets > 0 && (
        <Alert className="border-warning-border bg-warning-soft">
          <AlertCircle className="size-4 text-warning" />
          <AlertDescription>
            <strong className="text-warning">
              {nbIncomplets} dossier{nbIncomplets > 1 ? "s" : ""} incomplet{nbIncomplets > 1 ? "s" : ""}
            </strong>
            <br />
            <span className="text-sm text-muted-foreground">
              Ces employés ne peuvent pas être déclarés CNPS ni éditer de contrat
            </span>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dossiers incomplets ({nbIncomplets})</CardTitle>
        </CardHeader>
        <CardContent>
          {nbIncomplets === 0 ? (
            <div className="text-center py-12">
              <FileText className="size-12 mx-auto text-muted-foreground opacity-50 mb-3" />
              <p className="text-sm text-muted-foreground">Tous les dossiers sont complets ✓</p>
            </div>
          ) : (
            <div className="space-y-4">
              {employes.map((employe) => {
                const piecesAttendues = employe.typeMainOeuvre === "JOURNALIER" ? 2 : 7;
                const piecesManquantes = piecesAttendues - Math.round((employe.completudeDossier * piecesAttendues) / 100);

                return (
                  <Link
                    key={employe.id}
                    href={`/employes/${employe.id}`}
                    className="block rounded-lg border p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{employe.nom} {employe.prenom}</h3>
                          <Badge variant="outline" className="text-xs">{employe.matricule}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {employe.typeMainOeuvre === "PERMANENT" ? "Permanent" : "Journalier"}
                          </Badge>
                        </div>
                        {employe.posteActuel && (
                          <p className="text-sm text-muted-foreground">
                            {employe.posteActuel.libelle} • {employe.posteActuel.service?.libelle ?? employe.posteActuel.direction.libelle}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-warning border-warning">
                        {piecesManquantes} pièce{piecesManquantes > 1 ? "s" : ""} manquante{piecesManquantes > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Complétude du dossier</span>
                        <span className="font-medium">{employe.completudeDossier}%</span>
                      </div>
                      <Progress value={employe.completudeDossier} className="h-2" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {nbIncomplets > 0 && (
        <Alert>
          <FileText className="size-4" />
          <AlertDescription className="text-sm">
            <strong>Pièces attendues :</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Permanent (7 pièces) :</strong> Pièce d'identité, Extrait de naissance, Diplôme, Certificat de travail, Attestation CNPS, Visite médicale, Contrat signé</li>
              <li><strong>Journalier (2 pièces) :</strong> Pièce d'identité, Photo</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function SqueletteDocuments() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24" />
      <Skeleton className="h-64" />
    </div>
  );
}
