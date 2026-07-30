import { listerEmployes } from "@/lib/actions/employes";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, AlertCircle } from "lucide-react";
import { FiltresEmployes } from "./filtres-employes";
import { Pagination } from "@/components/pagination";
import { BoutonNouvelEmploye } from "./bouton-nouvel-employe";
import { LigneEmploye } from "./ligne-employe";
import type { TypeMainOeuvre } from "@prisma/client";

interface ListeEmployesProps {
  page: number;
  recherche?: string;
  directionId?: string;
  serviceId?: string;
  typeMainOeuvre?: TypeMainOeuvre;
  statutDossier?: "COMPLET" | "INCOMPLET";
}

// Libellés types main d'œuvre
const TYPE_MO_LABELS: Record<TypeMainOeuvre, string> = {
  PERMANENT: "Permanent",
  JOURNALIER: "Journalier",
};

// Couleurs badges type MO (R-01: label visible)
const TYPE_MO_VARIANTS: Record<TypeMainOeuvre, "default" | "secondary"> = {
  PERMANENT: "default",
  JOURNALIER: "secondary",
};

export async function ListeEmployes({
  page,
  recherche,
  directionId,
  serviceId,
  typeMainOeuvre,
  statutDossier,
}: ListeEmployesProps) {
  const { items: employes, total, pages } = await listerEmployes({
    page,
    recherche,
    directionId,
    serviceId,
    typeMainOeuvre,
    statutDossier,
  });

  // Charger les données pour la modale création
  const [postes, nationalites, directions, services] = await Promise.all([
    prisma.poste.findMany({
      select: {
        id: true,
        libelle: true,
        code: true,
        serviceId: true,
        directionId: true,
      },
      orderBy: { libelle: "asc" },
    }),
    prisma.nationalite.findMany({
      select: { id: true, libelle: true },
      orderBy: { libelle: "asc" },
    }),
    prisma.direction.findMany({
      select: { id: true, libelle: true },
      orderBy: { libelle: "asc" },
    }),
    prisma.service.findMany({
      select: { id: true, libelle: true, directionId: true },
      orderBy: { libelle: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <FiltresEmployes
        typeMainOeuvreActif={typeMainOeuvre}
        statutDossierActif={statutDossier}
        rechercheActive={recherche}
      />

      {/* Liste */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div>
            <p className="text-sm text-muted-foreground">
              {total} employé{total > 1 ? "s" : ""}
            </p>
          </div>
          <BoutonNouvelEmploye
            postes={postes}
            nationalites={nationalites}
            directions={directions}
            services={services}
          />
        </CardHeader>

        {employes.length === 0 ? (
          <CardContent className="py-12 text-center">
            <Users
              className="mx-auto size-12 text-muted-foreground/40"
              aria-hidden="true"
            />
            <p className="mt-4 text-sm text-muted-foreground">
              {recherche || typeMainOeuvre || statutDossier
                ? "Aucun employé ne correspond à vos critères."
                : "Aucun employé enregistré pour le moment."}
            </p>
            {!recherche && !typeMainOeuvre && !statutDossier && (
              <p className="mt-1 text-xs text-muted-foreground">
                Cliquez sur "Nouvel employé" pour créer un profil.
              </p>
            )}
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[1600px]">
                {/* En-têtes */}
                <div className="grid grid-cols-[200px_120px_100px_180px_200px_180px_100px_120px_120px_100px] gap-3 px-4 py-3 text-xs font-semibold text-gray-600 bg-gray-50 border-b-2 border-gray-200">
                  <div>EMPLOYÉ</div>
                  <div>MATRICULE ITA</div>
                  <div>RÉFÉRENCE</div>
                  <div>DIRECTION</div>
                  <div>SERVICE</div>
                  <div>POSTE</div>
                  <div>CONTRAT</div>
                  <div>SALAIRE</div>
                  <div>STATUT</div>
                  <div className="text-right">ACTIONS</div>
                </div>

                {/* Lignes */}
                {employes.map((employe) => (
                  <LigneEmploye key={employe.id} employe={employe} />
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {pages}
          </p>
          <Pagination
            page={page}
            totalPages={pages}
            baseUrl="/employes"
            searchParams={{
              recherche,
              typeMainOeuvre,
              statutDossier,
            }}
          />
        </div>
      )}
    </div>
  );
}
