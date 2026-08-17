import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

export async function TitreTaches() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <h2 className="text-lg font-semibold text-[#18181a]">Vos tâches</h2>;

  // Compter les tâches à traiter
  const nombreTaches = await prisma.projet.count({
    where: {
      OR: [
        { statut: "BROUILLON" }, // Projets en brouillon à compléter
        {
          statut: "EN_COURS",
          taches: {
            some: {
              avancementConstate: { lt: 100 },
            },
          },
        },
      ],
    },
  });

  return (
    <h2 className="text-lg font-semibold text-[#18181a] flex items-center gap-2">
      Vos tâches
      {nombreTaches > 0 && (
        <span className="inline-flex items-center justify-center size-6 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold tabular-nums">
          {nombreTaches}
        </span>
      )}
    </h2>
  );
}
