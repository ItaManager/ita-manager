"use server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifierCodeSecours } from "@/lib/auth/codes-secours";

// Consommation d'un code de secours pendant le défi MFA de connexion.
// Un code de secours n'est pas un facteur Supabase : il ne peut donc pas
// produire une session aal2 réelle (pour ne jamais en fabriquer une sans
// passage réel par Supabase). À la place, il supprime l'ancien facteur
// TOTP (perdu) et invalide tous les codes restants — la contrainte de
// rôle privilégié (voir app/page.tsx) relance alors l'inscription
// complète (nouveau QR, nouveaux codes) au prochain chargement.
export async function consommerCodeSecours(
  code: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false };
  }

  const codesStockes = await prisma.codeSecoursMfa.findMany({
    where: { profilId: user.id, utiliseLe: null },
  });

  const trouve = codesStockes.find((c) => verifierCodeSecours(code, c.codeHache));
  if (!trouve) {
    return { ok: false };
  }

  const { data: facteurs } = await supabase.auth.mfa.listFactors();
  const facteurTotp = facteurs?.totp?.[0];

  if (facteurTotp) {
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin.auth.admin.mfa.deleteFactor({
      id: facteurTotp.id,
      userId: user.id,
    });
  }

  await prisma.codeSecoursMfa.deleteMany({ where: { profilId: user.id } });

  return { ok: true };
}
