import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  obtenirEmploye,
  listerDocumentsEmploye,
  listerContratsEmploye,
  listerHistoriqueEmploye,
} from "@/lib/actions/employes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { User, FileText, History, FileSignature } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { OngletDocuments } from "./_components/onglet-documents";
import { OngletContrats } from "./_components/onglet-contrats";
import { OngletHistorique } from "./_components/onglet-historique";

interface PageDetailEmployeProps {
  params: Promise<{ id: string }>;
}

export default async function PageDetailEmploye({ params }: PageDetailEmployeProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Suspense fallback={<SqueletteDetailEmploye />}>
        <DetailEmploye employeId={id} />
      </Suspense>
    </div>
  );
}

async function DetailEmploye({ employeId }: { employeId: string }) {
  const [employe, documents, contrats, historique] = await Promise.all([
    obtenirEmploye(employeId),
    listerDocumentsEmploye(employeId),
    listerContratsEmploye(employeId),
    listerHistoriqueEmploye(employeId),
  ]);

  if (!employe) {
    notFound();
  }

  const estArchive = !!employe.archiveLe;
  const typeLabel = employe.typeMainOeuvre === "PERMANENT" ? "Permanent" : "Journalier";

  return (
    <>
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">
              {employe.nom} {employe.prenom}
            </h1>
            {estArchive && (
              <Badge variant="destructive">Archivé</Badge>
            )}
          </div>
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="font-mono">{employe.matricule}</span>
            <Badge variant="secondary">{typeLabel}</Badge>
            {employe.affectationActuelle && (
              <span>
                {employe.affectationActuelle.poste.libelle} •{" "}
                {employe.affectationActuelle.service?.libelle ??
                  employe.affectationActuelle.direction.libelle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="profil" className="w-full">
        <TabsList>
          <TabsTrigger value="profil">
            <User className="size-4 mr-2" aria-hidden="true" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="contrats">
            <FileSignature className="size-4 mr-2" aria-hidden="true" />
            Contrats
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="size-4 mr-2" aria-hidden="true" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="historique">
            <History className="size-4 mr-2" aria-hidden="true" />
            Historique
          </TabsTrigger>
        </TabsList>

        {/* Onglet Profil */}
        <TabsContent value="profil" className="space-y-6">
          {/* Identité */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Identité</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nom complet</span>
                  <p className="font-medium">
                    {employe.nom} {employe.prenom}
                  </p>
                </div>

                {employe.sexe && (
                  <div>
                    <span className="text-muted-foreground">Sexe</span>
                    <p className="font-medium">{employe.sexe}</p>
                  </div>
                )}

                {employe.dateNaissance && (
                  <div>
                    <span className="text-muted-foreground">Date de naissance</span>
                    <p className="font-medium">
                      {format(new Date(employe.dateNaissance), "d MMMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                )}

                {employe.lieuNaissance && (
                  <div>
                    <span className="text-muted-foreground">Lieu de naissance</span>
                    <p className="font-medium">{employe.lieuNaissance}</p>
                  </div>
                )}

                {employe.nationalite && (
                  <div>
                    <span className="text-muted-foreground">Nationalité</span>
                    <p className="font-medium">{employe.nationalite.libelle}</p>
                  </div>
                )}

                {employe.situationMatrimoniale && (
                  <div>
                    <span className="text-muted-foreground">Situation matrimoniale</span>
                    <p className="font-medium">{employe.situationMatrimoniale}</p>
                  </div>
                )}

                {employe.nombreEnfants !== null && employe.nombreEnfants !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Nombre d'enfants</span>
                    <p className="font-medium">{employe.nombreEnfants}</p>
                  </div>
                )}

                {employe.numeroCnps && (
                  <div>
                    <span className="text-muted-foreground">Numéro CNPS</span>
                    <p className="font-medium font-mono">{employe.numeroCnps}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Contact</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Téléphone</span>
                  <p className="font-medium font-mono">{employe.telephone}</p>
                </div>

                {employe.telephoneSecondaire && (
                  <div>
                    <span className="text-muted-foreground">Téléphone secondaire</span>
                    <p className="font-medium font-mono">{employe.telephoneSecondaire}</p>
                  </div>
                )}

                {employe.email && (
                  <div>
                    <span className="text-muted-foreground">Email</span>
                    <p className="font-medium">{employe.email}</p>
                  </div>
                )}

                {employe.adresse && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Adresse</span>
                    <p className="font-medium">{employe.adresse}</p>
                  </div>
                )}

                {(employe.urgenceNom || employe.urgenceTel) && (
                  <>
                    <div>
                      <span className="text-muted-foreground">Contact d'urgence (nom)</span>
                      <p className="font-medium">{employe.urgenceNom || "—"}</p>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Contact d'urgence (tél)</span>
                      <p className="font-medium font-mono">{employe.urgenceTel || "—"}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Affectation actuelle */}
          {employe.affectationActuelle && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">Affectation actuelle</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Poste</span>
                    <p className="font-medium">
                      {employe.affectationActuelle.poste.libelle}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Service/Direction</span>
                    <p className="font-medium">
                      {employe.affectationActuelle.service?.libelle ??
                        employe.affectationActuelle.direction.libelle}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Date de début</span>
                    <p className="font-medium">
                      {format(
                        new Date(employe.affectationActuelle.dateDebut),
                        "d MMMM yyyy",
                        { locale: fr }
                      )}
                    </p>
                  </div>

                  {employe.affectationActuelle.superieur && (
                    <div>
                      <span className="text-muted-foreground">Supérieur hiérarchique</span>
                      <p className="font-medium">
                        {employe.affectationActuelle.superieur.nom}{" "}
                        {employe.affectationActuelle.superieur.prenom}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contrat actif */}
          {employe.contratActif && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">Contrat actif</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type de contrat</span>
                    <p className="font-medium">{employe.contratActif.typeContrat}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Date de début</span>
                    <p className="font-medium">
                      {format(new Date(employe.contratActif.dateDebut), "d MMMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                  </div>

                  {employe.contratActif.dateFin && (
                    <div>
                      <span className="text-muted-foreground">Date de fin</span>
                      <p className="font-medium">
                        {format(new Date(employe.contratActif.dateFin), "d MMMM yyyy", {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-muted-foreground">Signé</span>
                    <p className="font-medium">
                      {employe.contratActif.signe ? "Oui" : "Non"}
                    </p>
                  </div>

                  {employe.salaire !== null && employe.salaire !== undefined && (
                    <div>
                      <span className="text-muted-foreground">
                        {employe.typeMainOeuvre === "PERMANENT"
                          ? "Salaire mensuel brut"
                          : "Taux journalier"}
                      </span>
                      <p className="font-medium font-mono">
                        {employe.salaire.toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Contrats */}
        <TabsContent value="contrats">
          <OngletContrats
            employeId={employe.id}
            contrats={contrats}
            typeMainOeuvre={employe.typeMainOeuvre}
          />
        </TabsContent>

        {/* Onglet Documents */}
        <TabsContent value="documents">
          <OngletDocuments
            employeId={employe.id}
            typeMainOeuvre={employe.typeMainOeuvre}
            documents={documents}
          />
        </TabsContent>

        {/* Onglet Historique */}
        <TabsContent value="historique">
          <OngletHistorique employeId={employe.id} evenements={historique} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function SqueletteDetailEmploye() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>

      <Skeleton className="h-12 w-full" />

      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
