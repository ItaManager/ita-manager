import { prisma } from "@/lib/db/prisma";
import { exigerPermission } from "@/lib/auth/guard";
import { detecterChevauchementConges } from "@/lib/missions/utils";
import { ModaleValiderRH } from "../_components/modale-valider-rh";
import { formaterDateCivile } from "@/lib/dates";
import { AlertTriangle } from "lucide-react";
import { ModuleLayout } from "@/components/layouts/module-layout";

export default async function ValidationRHMissionsPage() {
  await exigerPermission("mission:traiter");

  // Récupérer les missions en attente de validation RH
  const missions = await prisma.mission.findMany({
    where: {
      viseeN1Le: {
        not: null,
      },
      valideeRhLe: null,
      refuseeLe: null,
    },
    orderBy: {
      soumiseLe: "asc",
    },
    include: {
      demandeur: {
        select: {
          prenom: true,
          nom: true,
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

  // Pour chaque mission, détecter les chevauchements de congés
  const missionsAvecChevauchements = await Promise.all(
    missions.map(async (mission) => {
      const congesChevauches = await detecterChevauchementConges(
        mission.demandeurId,
        mission.dateDepart,
        mission.dateRetour
      );

      return {
        ...mission,
        congesChevauches,
      };
    })
  );

  return (
    <ModuleLayout
      titre="Validation RH — Missions"
      description="Valider les missions visées par les N+1 et détecter les chevauchements de congés"
      helpText="Contrôle final avant le départ en mission. Vérifiez la cohérence avec les congés validés, l'absence de blocage administratif, et le respect des procédures. Votre validation déclenche le versement de l'avance de frais."
    >
      {missionsAvecChevauchements.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Aucune mission en attente de validation RH
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {missionsAvecChevauchements.map((mission) => (
            <div
              key={mission.id}
              className={`rounded-lg border p-4 ${
                mission.congesChevauches.length > 0
                  ? "border-amber-500 bg-amber-50"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-lg">{mission.reference}</span>
                    {mission.congesChevauches.length > 0 && (
                      <div className="flex items-center gap-1.5 text-amber-700 text-sm">
                        <AlertTriangle className="size-4" />
                        <span className="font-medium">
                          Chevauchement congé ({mission.congesChevauches.length})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Demandeur :</span>
                      <div className="mt-0.5">
                        {mission.demandeur.prenom} {mission.demandeur.nom}
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Objet :</span>
                      <div className="mt-0.5">{mission.objet}</div>
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
                    </div>

                    <div>
                      <span className="text-muted-foreground">Moyen transport :</span>
                      <div className="mt-0.5">{mission.moyenTransport}</div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Frais estimés :</span>
                      <div className="mt-0.5 tabular-nums">
                        {mission.fraisEstimes.toString()} F
                      </div>
                    </div>

                    {mission.projet && (
                      <div>
                        <span className="text-muted-foreground">Projet :</span>
                        <div className="mt-0.5">
                          {mission.projet.code} — {mission.projet.nom}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-muted-foreground">Visée le :</span>
                      <div className="mt-0.5">
                        {formaterDateCivile(mission.viseeN1Le!)}
                      </div>
                    </div>
                  </div>

                  {mission.congesChevauches.length > 0 && (
                    <div className="mt-4 rounded-md bg-white border border-amber-300 p-3">
                      <div className="font-medium text-sm mb-2 text-amber-900">
                        Congés validés qui chevauchent cette mission :
                      </div>
                      <div className="space-y-1.5">
                        {mission.congesChevauches.map((conge) => (
                          <div
                            key={conge.id}
                            className="text-sm flex items-center gap-2"
                          >
                            <div className="size-1.5 rounded-full bg-amber-600" />
                            <span className="font-medium">
                              {conge.typeAbsence.libelle}
                            </span>
                            <span className="text-muted-foreground">
                              du {formaterDateCivile(conge.dateDebut)} au{" "}
                              {formaterDateCivile(conge.dateFin)} ({conge.nombreJours.toString()}{" "}
                              jours)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <ModaleValiderRH missionId={mission.id} reference={mission.reference} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModuleLayout>
  );
}
