import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import type { createClient } from "@/lib/supabase/server";

// Rôles pour lesquels la double authentification est contrainte dès la
// première connexion (M0-SOCLE.md §7). Les rôles de terrain (CT, CC, CE)
// n'y sont volontairement pas soumis.
const ROLES_TOTP_OBLIGATOIRE = ["ADMIN", "DG", "DRH", "DFC", "DT"];

export async function exigerTotpSiRolePrivilegie(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const profil = await prisma.profil.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });

  const rolePrivilegie = profil?.roles.some((profilRole) =>
    ROLES_TOTP_OBLIGATOIRE.includes(profilRole.role.code),
  );
  if (!rolePrivilegie) return;

  const { data: facteurs } = await supabase.auth.mfa.listFactors();
  if ((facteurs?.totp?.length ?? 0) === 0) {
    redirect("/securite/2fa");
  }
}
