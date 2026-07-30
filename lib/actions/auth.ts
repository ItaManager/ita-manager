/**
 * Server Actions — Authentification
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Déconnexion de l'utilisateur
 */
export async function deconnecter() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
