import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { ModaleDeposerRapport } from "./modale-deposer-rapport";
import { formaterDateCivile } from "@/lib/dates";

export async function ListeMissions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profil = await prisma.profil.findUnique({
    where: { id: user.id },
    select: { employeId: true },
  });

  if (!profil?.employeId) {
    return null;
  }

  const missions = await prisma.mission.findMany({
    where: {
      demandeurId: profil.employeId,
    },
    orderBy: {
      dateDepart: "desc",
    },
  });

  if (missions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Vous n'avez aucune mission enregistrée
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#0000001a]">
      <div className="p-4 border-b font-medium bg-muted/50">
        <div className="grid grid-cols-6 gap-4 text-sm">
          <div>Référence</div>
          <div>Objet</div>
          <div>Destination</div>
          <div>Dates</div>
          <div className="text-right">Montant</div>
          <div className="text-right">Statut</div>
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

          let statut = "En cours";
          let couleurStatut = "text-orange-600";

          if (mission.refuseeLe) {
            statut = "Refusée";
            couleurStatut = "text-red-600";
          } else if (mission.clotureeLe) {
            statut = "Clôturée";
            couleurStatut = "text-gray-600";
          } else if (mission.rapportDeposeLe) {
            statut = "Rapport déposé";
            couleurStatut = "text-green-600";
          } else if (mission.valideeRhLe) {
            statut = "Validée RH";
            couleurStatut = "text-green-600";
          } else if (mission.viseeN1Le) {
            statut = "Visée N+1";
            couleurStatut = "text-blue-600";
          } else if (mission.soumiseLe) {
            statut = "Soumise";
            couleurStatut = "text-blue-600";
          }

          return (
            <div key={mission.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="grid grid-cols-6 gap-4 items-center text-sm">
                <div className="font-medium">{mission.reference}</div>
                <div className="truncate">{mission.objet}</div>
                <div>{mission.destination}</div>
                <div className="text-xs tabular-nums">
                  {formaterDateCivile(mission.dateDepart)} →{" "}
                  {formaterDateCivile(mission.dateRetour)}
                </div>
                <div className="text-right tabular-nums">
                  {mission.fraisEstimes.toString()} F
                </div>
                <div className="text-right">
                  {rapportAttend ? (
                    <ModaleDeposerRapport
                      missionId={mission.id}
                      employeId={profil.employeId!}
                      reference={mission.reference}
                    />
                  ) : (
                    <span className={`text-xs ${couleurStatut}`}>{statut}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
