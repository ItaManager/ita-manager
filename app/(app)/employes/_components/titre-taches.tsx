import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

interface TitreTachesProps {
  count: number;
}

export async function TitreTaches({ count }: TitreTachesProps) {
  // Récupérer le prénom de manière optimisée
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let prenom = "";
  if (user) {
    const employe = await prisma.employe.findFirst({
      where: { profil: { id: user.id } },
      select: { prenom: true },
    });
    prenom = employe?.prenom || "";
  }

  return (
    <h2 className="text-lg font-semibold text-[#18181a]">
      Bonjour {prenom}, vous avez {count} {count <= 1 ? "tâche" : "tâches"} en attente
    </h2>
  );
}
