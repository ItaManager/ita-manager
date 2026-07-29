import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

// Codes de secours MFA — node:crypto uniquement, aucune dépendance
// tierce (D-02, « aucune couche supplémentaire »). Jamais stockés en
// clair : seul le hash (sel + scrypt) est conservé.

export function genererCodeSecours(): string {
  return randomInt(0, 100_000_000).toString().padStart(8, "0");
}

export function hacherCodeSecours(code: string): string {
  const sel = randomBytes(16).toString("hex");
  const hash = scryptSync(code, sel, 64).toString("hex");
  return `${sel}:${hash}`;
}

export function verifierCodeSecours(code: string, hache: string): boolean {
  const [sel, hash] = hache.split(":");
  if (!sel || !hash) return false;
  const calcule = scryptSync(code, sel, 64);
  const stocke = Buffer.from(hash, "hex");
  return calcule.length === stocke.length && timingSafeEqual(calcule, stocke);
}
