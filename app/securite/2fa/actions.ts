"use server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { genererCodeSecours, hacherCodeSecours } from "@/lib/auth/codes-secours";

// Action réservée à un utilisateur connecté (pas de permission
// particulière : chacun gère son propre second facteur) — appelée
// juste après une vérification TOTP réussie côté client.
export async function genererCodesSecours(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Non authentifié.");
  }

  // Une nouvelle inscription TOTP invalide les anciens codes non utilisés.
  await prisma.codeSecoursMfa.deleteMany({
    where: { profilId: user.id, utiliseLe: null },
  });

  const codes = Array.from({ length: 10 }, () => genererCodeSecours());
  await prisma.codeSecoursMfa.createMany({
    data: codes.map((code) => ({
      profilId: user.id,
      codeHache: hacherCodeSecours(code),
    })),
  });

  return codes;
}
