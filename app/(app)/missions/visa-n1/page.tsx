import { prisma } from "@/lib/db/prisma";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModaleViserN1 } from "../_components/modale-viser-n1";
import { formaterDateCivile } from "@/lib/dates";
import { ClipboardCheck } from "lucide-react";

export default async function VisaN1MissionsPage() {
  // PAS de permission — contrôle par lien de données
  const userId = await verifierAccesPage("/missions/visa-n1");

  // Récupérer l'employé lié à l'utilisateur
  const profil = await prisma.profil.findUnique({
    where: { id: userId },
    select: { employeId: true },
  });

  if (!profil?.employeId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-4">Visa N+1 — Missions</h1>
        <p className="text-muted-foreground">
          Aucun profil employé trouvé.
        </p>
      </div>
    );
  }

  // Récupérer les missions en attente de visa N+1
  // Contrôle par lien de données : supérieur = profil.employeId
  const missions = await prisma.mission.findMany({
    where: {
      soumiseLe: {
        not: null,
      },
      viseeN1Le: null,
      refuseeLe: null,
      demandeur: {
        affectations: {
          some: {
            superieurId: profil.employeId,
            dateFin: null, // Affectation en cours
          },
        },
      },
    },
    orderBy: {
      soumiseLe: "asc",
    },
    include: {
      demandeur: {
        select: {
          prenom: true,
          nom: true,
          affectations: {
            where: {
              dateFin: null,
            },
            include: {
              poste: {
                select: {
                  libelle: true,
                },
              },
            },
          },
        },
      },
      projet: {
        select: {
          code: true,
          nom: true,
        },
      },
    },
  });

  // Calculer la durée en jours (helper pour l'affichage)
  function calculerDureeJours(dateDepart: Date, dateRetour: Date): number {
    const debut = new Date(dateDepart);
    const fin = new Date(dateRetour);
    const diffMs = fin.getTime() - debut.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de départ
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Visa N+1 — Missions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Missions de vos collaborateurs en attente de votre visa
        </p>
      </div>

      {missions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <ClipboardCheck className="size-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Aucune mission en attente de votre visa
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {missions.map((mission) => {
            const affectation = mission.demandeur.affectations[0];
            const dureeJours = calculerDureeJours(mission.dateDepart, mission.dateRetour);

            return (
              <div
                key={mission.id}
                className="rounded-lg border p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-medium text-lg">{mission.reference}</span>
                      <span className="text-sm text-muted-foreground">
                        Soumise le {formaterDateCivile(mission.soumiseLe!)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Demandeur :</span>
                        <div className="mt-0.5">
                          <div className="font-medium">
                            {mission.demandeur.prenom} {mission.demandeur.nom}
                          </div>
                          {affectation && (
                            <div className="text-xs text-muted-foreground">
                              {affectation.poste.libelle}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Objet :</span>
                        <div className="mt-0.5 font-medium">{mission.objet}</div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Destination :</span>
                        <div className="mt-0.5">{mission.destination}</div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Dates :</span>
                        <div className="mt-0.5">
                          {formaterDateCivile(mission.dateDepart)} →{" "}
                          {formaterDateCivile(mission.dateRetour)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({dureeJours} {dureeJours > 1 ? "jours" : "jour"})
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Moyen transport :</span>
                        <div className="mt-0.5">
                          {mission.moyenTransport === "VEHICULE_ITA"
                            ? "Véhicule ITA"
                            : mission.moyenTransport === "TRANSPORT_COMMUN"
                            ? "Transport en commun"
                            : mission.moyenTransport === "VEHICULE_PERSONNEL"
                            ? "Véhicule personnel"
                            : mission.moyenTransport === "AVION"
                            ? "Avion"
                            : "Autre"}
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground">Frais estimés :</span>
                        <div className="mt-0.5 tabular-nums">
                          {mission.fraisEstimes.toString()} F
                        </div>
                      </div>

                      {mission.projet && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Projet :</span>
                          <div className="mt-0.5">
                            {mission.projet.code} — {mission.projet.nom}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    <ModaleViserN1
                      missionId={mission.id}
                      reference={mission.reference}
                      employeId={profil.employeId!}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
