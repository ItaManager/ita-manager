import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { formaterDateCivile } from "@/lib/dates";
import { FileText, AlertCircle } from "lucide-react";
import Link from "next/link";

export async function ListeTaches() {
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

  // Missions nécessitant une action de ma part
  const missionsEnAttente = await prisma.mission.findMany({
    where: {
      demandeurId: profil.employeId,
      OR: [
        // Mission validée RH, passée, sans rapport
        {
          valideeRhLe: { not: null },
          rapportDeposeLe: null,
          dateRetour: { lt: new Date() },
        },
        // Mission refusée non traitée
        {
          refuseeLe: { not: null },
          // Pas de champ "lu" pour l'instant
        },
      ],
    },
    orderBy: {
      dateRetour: "desc",
    },
    take: 5,
    select: {
      id: true,
      reference: true,
      objet: true,
      dateRetour: true,
      valideeRhLe: true,
      refuseeLe: true,
      rapportDeposeLe: true,
      motifRefus: true,
    },
  });

  if (missionsEnAttente.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Aucune tâche en attente
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {missionsEnAttente.map((mission) => {
        const estRapport = mission.valideeRhLe && !mission.rapportDeposeLe;
        const estRefus = mission.refuseeLe;

        return (
          <Link
            key={mission.id}
            href="/missions"
            className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors"
          >
            {estRefus ? (
              <AlertCircle className="size-4 text-red-600 mt-0.5 shrink-0" />
            ) : (
              <FileText className="size-4 text-orange-600 mt-0.5 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#18181a]">
                {mission.reference}
              </p>
              <p className="text-xs text-[#00000099] truncate">
                {mission.objet}
              </p>
              {estRefus && mission.motifRefus && (
                <p className="text-xs text-red-600 mt-1">
                  Refusée : {mission.motifRefus}
                </p>
              )}
              {estRapport && (
                <p className="text-xs text-orange-600 mt-1">
                  Rapport à déposer (retour : {formaterDateCivile(mission.dateRetour)})
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
