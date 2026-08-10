import { prisma } from "@/lib/db/prisma";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { BoutonNouvelleMission } from "./_components/bouton-nouvelle-mission";
import { ModaleDeposerRapport } from "./_components/modale-deposer-rapport";
import { peutCreerMission } from "@/lib/missions/utils";
import { AlertCircle } from "lucide-react";

export default async function MissionsPage() {
  const userId = await verifierAccesPage("/missions");

  // Récupérer l'employé lié à l'utilisateur
  const profil = await prisma.profil.findUnique({
    where: { id: userId },
    select: { employeId: true },
  });

  if (!profil?.employeId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-4">Missions</h1>
        <p className="text-muted-foreground">
          Aucun profil employé trouvé.
        </p>
      </div>
    );
  }

  // Vérifier le blocage nouvelle mission
  const peut = await peutCreerMission(profil.employeId);

  // Si bloqué, récupérer la mission bloquante
  const missionBloquante = !peut
    ? await prisma.mission.findFirst({
        where: {
          demandeurId: profil.employeId,
          dateRetour: { lt: new Date() },
          rapportDeposeLe: null,
          clotureeLe: null,
          refuseeLe: null,
          annuleeLe: null,
        },
        select: {
          id: true,
          reference: true,
          objet: true,
          dateRetour: true,
          fraisEstimes: true,
        },
      })
    : null;

  // Récupérer les missions de l'employé
  const missions = await prisma.mission.findMany({
    where: {
      demandeurId: profil.employeId,
    },
    orderBy: {
      dateDepart: "desc",
    },
    include: {
      demandeur: {
        select: {
          prenom: true,
          nom: true,
        },
      },
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Mes missions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos demandes de mission et rapports
          </p>
        </div>
        <BoutonNouvelleMission
          employeId={profil.employeId}
          bloque={!peut}
          raisonBlocage={
            missionBloquante
              ? `Mission ${missionBloquante.reference} : rapport attendu depuis le ${new Date(missionBloquante.dateRetour).toLocaleDateString("fr-FR")}`
              : undefined
          }
        />
      </div>

      {/* Bandeau de blocage */}
      {missionBloquante && (
        <div className="mb-6 rounded-md border border-orange-200 bg-orange-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="size-5 text-orange-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <h3 className="font-medium text-orange-900 mb-1">
                Rapport de mission en attente
              </h3>
              <p className="text-sm text-orange-800 mb-3">
                Vous ne pouvez pas créer de nouvelle mission tant que le rapport de la mission{" "}
                <span className="font-mono font-medium">{missionBloquante.reference}</span> ({missionBloquante.objet})
                n'est pas déposé. Retour prévu le{" "}
                {new Date(missionBloquante.dateRetour).toLocaleDateString("fr-FR")}.
                Avance versée : <span className="tabular-nums">{missionBloquante.fraisEstimes.toString()} F</span>.
              </p>
              <ModaleDeposerRapport
                missionId={missionBloquante.id}
                employeId={profil.employeId}
                reference={missionBloquante.reference}
              />
            </div>
          </div>
        </div>
      )}

      {missions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground mb-4">
            Vous n'avez aucune mission enregistrée
          </p>
          <BoutonNouvelleMission employeId={profil.employeId} />
        </div>
      ) : (
        <div className="rounded-lg border">
          <div className="p-4 border-b font-medium bg-muted/50">
            <div className="grid grid-cols-6 gap-4">
              <div>Référence</div>
              <div>Objet</div>
              <div>Destination</div>
              <div>Dates</div>
              <div className="text-right">Montant</div>
              <div className="text-right">Actions</div>
            </div>
          </div>
          <div className="divide-y">
            {missions.map((mission) => {
              const aujourdhuiCivile = new Date();
              aujourdhuiCivile.setUTCHours(0, 0, 0, 0);

              const rapportAttend =
                mission.valideeRhLe !== null &&
                mission.rapportDeposeLe === null &&
                mission.dateRetour < aujourdhuiCivile &&
                mission.refuseeLe === null;

              return (
                <div key={mission.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <div className="font-medium">{mission.reference}</div>
                    <div>{mission.objet}</div>
                    <div>{mission.destination}</div>
                    <div className="text-sm">
                      {new Date(mission.dateDepart).toLocaleDateString("fr-FR")} →{" "}
                      {new Date(mission.dateRetour).toLocaleDateString("fr-FR")}
                    </div>
                    <div className="text-right tabular-nums">
                      {mission.fraisEstimes.toString()} F
                    </div>
                    <div className="text-right">
                      {rapportAttend && profil.employeId && (
                        <ModaleDeposerRapport
                          missionId={mission.id}
                          employeId={profil.employeId}
                          reference={mission.reference}
                        />
                      )}
                      {mission.rapportDeposeLe && (
                        <span className="text-xs text-green-600">Rapport déposé</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
