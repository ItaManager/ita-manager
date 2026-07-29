"use server";

import { createClient as createClientJetable } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Déverrouillage de session : vérifie le mot de passe via un client
// Supabase jetable (persistSession/autoRefreshToken désactivés — aucun
// cookie touché, aucun nouveau JWT émis). La session réelle de
// l'utilisateur n'est jamais recréée ; on ne fait que confirmer qu'il
// connaît toujours son mot de passe.
export async function verifierMotDePassePourDeverrouillage(
  motDePasse: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false };
  }

  const clientJetable = createClientJetable(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { error } = await clientJetable.auth.signInWithPassword({
    email: user.email,
    password: motDePasse,
  });

  return { ok: !error };
}
