import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";

export async function IndicateursMissions() {
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

  // Compter les missions par statut
  const [total, enCours, validees, refusees] = await Promise.all([
    prisma.mission.count({
      where: { demandeurId: profil.employeId },
    }),
    prisma.mission.count({
      where: {
        demandeurId: profil.employeId,
        soumiseLe: { not: null },
        clotureeLe: null,
        refuseeLe: null,
      },
    }),
    prisma.mission.count({
      where: {
        demandeurId: profil.employeId,
        valideeRhLe: { not: null },
        refuseeLe: null,
      },
    }),
    prisma.mission.count({
      where: {
        demandeurId: profil.employeId,
        refuseeLe: { not: null },
      },
    }),
  ]);

  const indicateurs = [
    {
      label: "Total missions",
      valeur: total,
      icon: FileText,
      couleur: "text-blue-600",
    },
    {
      label: "En cours",
      valeur: enCours,
      icon: Clock,
      couleur: "text-orange-600",
    },
    {
      label: "Validées",
      valeur: validees,
      icon: CheckCircle,
      couleur: "text-green-600",
    },
    {
      label: "Refusées",
      valeur: refusees,
      icon: XCircle,
      couleur: "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {indicateurs.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-[#0000001a] p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`${item.couleur} bg-opacity-10 p-2 rounded-lg`}>
                <Icon className={`size-5 ${item.couleur}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#18181a] tabular-nums">
                  {item.valeur}
                </p>
                <p className="text-xs text-[#00000099]">{item.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
