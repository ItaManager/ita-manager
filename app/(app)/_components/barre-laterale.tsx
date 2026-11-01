import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { BarreLateraleClient } from "./barre-laterale-client";

export async function BarreLaterale() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Charger les permissions de l'utilisateur
  const profil = await prisma.profil.findUnique({
    where: { id: user.id },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  const userPermissions =
    profil?.roles.flatMap((pr) => pr.role.permissions.map((rp) => rp.permission.code)) || [];

  // Compteurs désactivés temporairement pour améliorer les performances
  // TODO: Charger les compteurs côté client avec React Query ou SWR
  const compteursAchats = { aValider: 0, aInstruire: 0, commandes: 0, receptions: 0, factures: 0 };
  const compteursConges = { aValiderN1: 0, aControler: 0, controleRH: 0 };
  const compteursMissions = { aValiderN1: 0, aValiderRH: 0, aViser: 0, aTraiter: 0 };

  return (
    <BarreLateraleClient
      userPermissions={userPermissions}
      compteursAchats={compteursAchats}
      compteursConges={compteursConges}
      compteursMissions={compteursMissions}
    />
  );
}
