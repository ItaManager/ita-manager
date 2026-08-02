import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { BarreLateraleClient } from "./barre-laterale-client";
import { chargerCompteursAchats } from "@/lib/actions/compteurs-achats";

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

  // Charger les compteurs de badges pour les achats
  const compteursAchats = await chargerCompteursAchats();

  return <BarreLateraleClient userPermissions={userPermissions} compteursAchats={compteursAchats} />;
}
