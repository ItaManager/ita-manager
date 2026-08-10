import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

export async function TitreTaches() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <h2 className="text-lg font-semibold text-[#18181a]">Vos tâches</h2>;
  }

  const profil = await prisma.profil.findUnique({
    where: { id: user.id },
    select: { employeId: true },
  });

  if (!profil?.employeId) {
    return <h2 className="text-lg font-semibold text-[#18181a]">Vos tâches</h2>;
  }

  const count = await prisma.mission.count({
    where: {
      demandeurId: profil.employeId,
      OR: [
        {
          valideeRhLe: { not: null },
          rapportDeposeLe: null,
          dateRetour: { lt: new Date() },
        },
        {
          refuseeLe: { not: null },
        },
      ],
    },
  });

  return (
    <h2 className="text-lg font-semibold text-[#18181a]">
      Vos tâches
      {count > 0 && (
        <span className="ml-2 text-sm font-normal text-[#00000099]">
          ({count})
        </span>
      )}
    </h2>
  );
}
