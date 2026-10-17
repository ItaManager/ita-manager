import "server-only";
import { randomBytes } from "crypto";

/**
 * Génère 10 codes de secours alphanumériques pour la MFA
 * Format : XXXX-XXXX (8 caractères par code)
 *
 * Ces codes permettent à l'utilisateur de se connecter si :
 * - Il perd son téléphone avec l'application Authenticator
 * - Il change de téléphone
 * - L'application Authenticator est désinstallée
 *
 * Chaque code ne peut être utilisé qu'une seule fois.
 */
export async function genererCodesSecours(): Promise<string[]> {
  const codes: string[] = [];

  for (let i = 0; i < 10; i++) {
    // Générer 4 bytes aléatoires et les convertir en hexadécimal
    const bytes = randomBytes(4);
    const hex = bytes.toString('hex').toUpperCase();

    // Formater comme XXXX-XXXX
    const code = `${hex.substring(0, 4)}-${hex.substring(4, 8)}`;
    codes.push(code);
  }

  return codes;
}

/**
 * Vérifie si un code de secours est valide
 * Compare le code fourni avec les hashes stockés en base
 */
export async function verifierCodeSecours(
  code: string,
  codeHache: string
): Promise<boolean> {
  const bcrypt = await import("bcrypt");
  return bcrypt.compare(code, codeHache);
}

/**
 * Formate un code de secours pour l'affichage
 * Supprime les espaces et convertit en majuscules
 */
export function formaterCodeSecours(code: string): string {
  return code.replace(/\s/g, "").toUpperCase();
}
