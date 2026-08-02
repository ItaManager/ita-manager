/**
 * Utilitaires de manipulation de dates
 *
 * RÈGLE CRITIQUE : Ne jamais utiliser toLocaleDateString() sur un @db.Date
 * sans forcer le fuseau UTC.
 *
 * Prisma stocke @db.Date à minuit UTC. Une conversion en heure locale décale
 * la date civile d'un jour (selon le fuseau). Sur un compte à rebours
 * d'échéance, c'est un défaut réel : une pièce expirant aujourd'hui
 * s'afficherait comme expirée hier.
 */

/**
 * Formater une date civile (@db.Date) en DD/MM/YYYY
 *
 * Force le fuseau UTC pour éviter le décalage d'un jour lors de l'affichage.
 *
 * @param date Date Prisma (@db.Date) stockée à minuit UTC
 * @returns Date formatée en DD/MM/YYYY (ex: "01/11/2025")
 */
export function formaterDateCivile(date: Date): string {
  const fmt = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return fmt.format(date);
}

/**
 * Formater une date civile (@db.Date) en format long
 *
 * Force le fuseau UTC pour éviter le décalage d'un jour lors de l'affichage.
 *
 * @param date Date Prisma (@db.Date) stockée à minuit UTC
 * @returns Date formatée (ex: "1 novembre 2025")
 */
export function formaterDateLongue(date: Date): string {
  const fmt = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return fmt.format(date);
}

/**
 * Calculer le nombre de jours entre deux dates civiles
 *
 * Compare des dates civiles (année/mois/jour), pas des instants.
 * Élimine les effets de bord liés au fuseau horaire.
 *
 * @param a Date de début
 * @param b Date de fin
 * @returns Nombre de jours entre a et b (négatif si b < a)
 */
export function joursEntre(a: Date, b: Date): number {
  const jourUTC = (d: Date) =>
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

  return Math.round((jourUTC(b) - jourUTC(a)) / 86400000);
}

/**
 * Formater une date+heure (DateTime) en DD/MM/YYYY HH:MM
 *
 * Pour les timestamps (createdAt, updatedAt, etc.) stockés avec l'heure.
 * Convertit en heure locale de l'utilisateur.
 *
 * @param date DateTime Prisma
 * @returns Date+heure formatée (ex: "01/11/2025 14:30")
 */
export function formaterDateTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formater une date+heure relative ("il y a X jours")
 *
 * Pour afficher des timestamps de manière relative.
 *
 * @param date DateTime Prisma
 * @returns Texte relatif (ex: "il y a 3 jours")
 */
export function formaterDateRelative(date: Date): string {
  const maintenant = new Date();
  const diffMs = maintenant.getTime() - date.getTime();
  const diffJours = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffJours === 0) return "aujourd'hui";
  if (diffJours === 1) return 'hier';
  if (diffJours < 7) return `il y a ${diffJours} jours`;
  if (diffJours < 30) {
    const semaines = Math.floor(diffJours / 7);
    return `il y a ${semaines} semaine${semaines > 1 ? 's' : ''}`;
  }
  if (diffJours < 365) {
    const mois = Math.floor(diffJours / 30);
    return `il y a ${mois} mois`;
  }

  const annees = Math.floor(diffJours / 365);
  return `il y a ${annees} an${annees > 1 ? 's' : ''}`;
}
