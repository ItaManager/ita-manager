/**
 * Vérification TOTP pour les Server Actions critiques
 *
 * Utilisé par M15 pour l'autorisation de paiement (SECURITE-M15.md § 1, interdit #3)
 * Réutilise la vérification existante de M0 via Supabase Auth.
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Vérifie qu'un utilisateur a un facteur TOTP actif
 *
 * @param userId - ID du profil utilisateur
 * @returns true si l'utilisateur a TOTP activé, false sinon
 */
export async function utilisateurATotpActif(userId: string): Promise<boolean> {
  const supabase = await createClient();

  // Vérifier que l'utilisateur existe dans Supabase Auth
  const { data: user } = await supabase.auth.admin.getUserById(userId);
  if (!user.user) return false;

  // Lister les facteurs MFA de l'utilisateur
  const { data: facteurs } = await supabase.auth.mfa.listFactors();

  // Vérifier qu'au moins un facteur TOTP existe
  return (facteurs?.totp?.length ?? 0) > 0;
}
