# Politique de sécurité — ITA Manager

> Document normatif. Toute contribution au code doit s'y conformer.
> Les exigences marquées **[BLOQUANT]** interdisent la mise en production
> si elles ne sont pas satisfaites.

**Périmètre** : `app.itamanager.cloud` — ERP interne d'ITA SARL.
**Stack** : Next.js sur Vercel · Supabase (Postgres, Auth, Storage) · Prisma · Resend · Cloudflare.

---

## 1. Cadre réglementaire

L'application traite des données à caractère personnel d'employés en Côte d'Ivoire.

| Texte | Portée |
| --- | --- |
| Loi n° 2013-450 du 19 juin 2013 | Protection des données à caractère personnel en Côte d'Ivoire |
| Autorité de tutelle | ARTCI — déclaration préalable du traitement requise |
| Code du travail ivoirien | Conservation des pièces d'emploi et des bulletins |
| RGPD | Applicable seulement si des données de résidents de l'UE sont traitées |

**Actions à mener hors code :**

- [ ] Déclarer le traitement auprès de l'ARTCI avant la mise en production.
- [ ] Désigner un responsable de traitement nommément.
- [ ] Rédiger une notice d'information remise aux employés : finalités, destinataires, durée de conservation, droits d'accès et de rectification.
- [ ] Établir la base légale du traitement — exécution du contrat de travail pour l'essentiel, obligation légale pour la CNPS.

> Je ne suis pas juriste. Faites valider ce volet par un conseil local
> avant la mise en service : les modalités de déclaration ARTCI et les
> durées de conservation applicables relèvent de son appréciation.

---

## 2. Classification des données

| Niveau | Données | Règles |
| --- | --- | --- |
| **Critique** | Certificats médicaux, arrêts maladie | Accès restreint à la Direction RH. Consultation journalisée. Jamais dans un export non chiffré. |
| **Sensible** | RIB, numéro CNPS, salaire, dérogations | Permission dédiée `employe:donneesSensibles`. Masqués par défaut dans les listes. |
| **Personnel** | Identité, date et lieu de naissance, adresse, téléphones, situation familiale | Accès limité aux rôles RH. |
| **Interne** | Affectation, poste, planning, relevés d'activité | Accessible aux rôles opérationnels concernés. |
| **Métier** | Appels d'offres, projets, parc matériel | Accessible selon le rôle. Les montants d'AO non déposés sont confidentiels. |

**Règle de minimisation.** Un écran n'affiche que ce que son usage exige.
La liste du personnel ne montre pas les RIB ; la fiche les affiche à la demande,
derrière une permission, et la consultation est tracée.

---

## 3. Authentification

Assurée par Supabase Auth.

**[BLOQUANT]** Vérifier la session avec `supabase.auth.getUser()`, jamais
`getSession()`. `getSession` lit le cookie sans le valider auprès du serveur ;
un cookie est falsifiable.

| Exigence | Réglage |
| --- | --- |
| Longueur minimale du mot de passe | 12 caractères |
| Vérification contre les fuites connues | Activer « Leaked password protection » (HIBP) dans Supabase |
| Durée du JWT | 1 heure |
| Durée du refresh token | 7 jours, rotation activée |
| Double authentification | **Obligatoire** pour DG, DRH, DFC, DT et ADMIN |
| Tentatives de connexion | Limitation Supabase activée, plus règle Cloudflare |
| Comptes partagés | Interdits, sans exception |

**Cycle de vie.** La création d'un employé ne crée pas de compte : tous les
ouvriers n'ont pas d'adresse. Une action explicite « Ouvrir un accès » envoie
une invitation Resend. Le départ d'un employé déclenche la désactivation du
profil — `Profil.actif = false` — qui prend effet immédiatement, sans attendre
l'expiration du jeton.

---

## 4. Autorisation

**[BLOQUANT]** Prisma se connecte avec un rôle privilégié et **contourne les
Row Level Security**. Toute l'autorisation repose sur la couche applicative.

**[BLOQUANT]** Une Server Action est un point d'entrée HTTP public. Être
appelée depuis une page protégée ne la protège pas : une requête POST directe
sur son identifiant suffit à la déclencher. Chaque Server Action et chaque
Route Handler commence par `exigerPermission(...)`, avant toute lecture de
paramètre.

```ts
// ❌ Interdit — l'action est ouverte à tous
export async function supprimerEmploye(id: string) {
  await prisma.employe.delete({ where: { id } });
}

// ✅ Attendu
export const supprimerEmploye = actionProtegee(
  PERMISSIONS.EMPLOYE_ARCHIVER,
  async (session, id: string) => { … },
);
```

**Contrôle d'accès horizontal.** Une permission ne suffit pas : vérifier aussi
que la ressource est dans le périmètre de l'utilisateur. Un conducteur de
travaux vise les relevés de *ses* chantiers, pas de tous.

**Masquage dans l'interface.** Un bouton masqué n'est pas une protection, c'est
une commodité. Le contrôle serveur reste obligatoire même quand l'interface
cache l'action.

---

## 5. Stockage de fichiers

Supabase Storage — CNI, diplômes, certificats médicaux, justificatifs d'absence,
pièces d'appel d'offres.

**[BLOQUANT]** Tous les buckets sont **privés**. Aucun fichier RH n'est
accessible par URL publique.

| Bucket | Contenu | Accès |
| --- | --- | --- |
| `documents-employes` | Pièces du dossier RH | URL signée, 5 minutes |
| `justificatifs-absences` | Certificats médicaux, actes de décès | URL signée, 5 minutes, consultation journalisée |
| `pieces-appels-offres` | DAO, offres, cautions | URL signée, 15 minutes |
| `releves-chantier` | Photos de chantier | URL signée, 15 minutes |

**Contrôles au dépôt**, tous côté serveur :

- Type MIME vérifié sur le contenu, pas sur l'extension ni sur l'en-tête déclaré.
- Formats acceptés : PDF, JPEG, PNG, DOCX. Rien d'autre.
- Taille maximale : 10 Mo.
- Nom de fichier régénéré — `{uuid}-{nom-assaini}` — pour écarter la traversée de chemin et les caractères de contrôle.
- Chemin imposé : `{employeId}/{typeCode}/{fichier}`. Jamais construit depuis une entrée utilisateur.

---

## 6. Transport et en-têtes

Cloudflare devant Vercel.

| Élément | Réglage |
| --- | --- |
| TLS | 1.2 minimum, mode « Full (strict) » |
| HSTS | `max-age=63072000; includeSubDomains; preload` |
| WAF | Jeu de règles géré activé |
| Limitation de débit | 10 tentatives de connexion / 10 min / IP ; 100 requêtes / min / IP sur `/api` |
| Bot Fight Mode | Activé |

En-têtes applicatifs à poser dans `next.config.ts` :

```
Content-Security-Policy       default-src 'self'; img-src 'self' data: blob: https://*.supabase.co;
                              script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
                              connect-src 'self' https://*.supabase.co; frame-ancestors 'none'
X-Frame-Options               DENY
X-Content-Type-Options        nosniff
Referrer-Policy               strict-origin-when-cross-origin
Permissions-Policy            camera=(), microphone=(), geolocation=(self)
```

`geolocation=(self)` est conservé : le pointage de chantier pourra en avoir besoin.

---

## 7. Secrets

**[BLOQUANT]** `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais porter le préfixe
`NEXT_PUBLIC_`, ni apparaître dans un composant client. Cette clé contourne
toutes les protections.

| Variable | Portée | Public ? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Serveur | **Non** |
| `DATABASE_URL` | Serveur — pgBouncer, port 6543 | **Non** |
| `DIRECT_URL` | Serveur — migrations, port 5432 | **Non** |
| `RESEND_API_KEY` | Serveur | **Non** |
| `CRON_SECRET` | Serveur | **Non** |

Environnements Vercel séparés — développement, préproduction, production —
avec des clés distinctes. Rotation semestrielle, et immédiate au départ d'un
administrateur.

---

## 8. Journalisation et audit

Le modèle `JournalEvenement` trace toute décision opposable : validations,
refus, changements de règle, révisions de grille, exports.

**Événements obligatoires** : connexion et échec de connexion, refus d'accès,
création et modification d'employé, décision sur une absence, dérogation
salariale, validation de période de paie, révision de grille, modification des
règles de congés, consultation d'une pièce médicale, export de données.

**[BLOQUANT]** Aucune donnée sensible en clair dans les journaux ni dans les
logs applicatifs : ni RIB, ni numéro CNPS, ni contenu de certificat médical.
On journalise des identifiants, pas des valeurs.

Le journal est **en ajout seul**. Aucune Server Action ne l'expose en
modification ou en suppression. Conservation : 5 ans.

---

## 9. Sauvegarde et continuité

| Élément | Exigence |
| --- | --- |
| Sauvegarde base | Point-in-time recovery Supabase, rétention 7 jours minimum |
| Sauvegarde Storage | Réplication ou export périodique — **à configurer, non couvert par défaut** |
| Test de restauration | Trimestriel, sur un projet Supabase séparé, avec compte rendu écrit |
| RPO visé | 1 heure |
| RTO visé | 4 heures |

Une sauvegarde jamais restaurée n'est pas une sauvegarde.

---

## 10. Conservation et effacement

| Donnée | Durée | Point de départ |
| --- | --- | --- |
| Dossier employé | 5 ans | Fin du contrat |
| Bulletins et éléments de paie | 5 ans | Émission |
| Journal d'audit | 5 ans | Événement |
| Candidatures non retenues | 2 ans | Décision |
| Certificats médicaux | Durée du contrat, puis suppression | — |
| Appels d'offres non retenus | 3 ans | Résultat |

Le départ d'un employé n'efface pas son dossier : il déclenche l'archivage
(`archiveLe`) et la désactivation de l'accès. L'effacement effectif intervient
au terme de la durée de conservation, par une tâche dédiée.

---

## 11. Développement sécurisé

- Validation zod **côté serveur** sur toute entrée, y compris lorsque le
  client valide déjà. Le client peut être contourné.
- Prisma paramètre les requêtes : ne jamais recourir à `$queryRawUnsafe`.
- Dépendances : `npm audit` en intégration continue, mises à jour de sécurité
  sous 7 jours.
- Aucun secret en dur dans le code. Détection de secrets activée sur le dépôt.
- Revue obligatoire pour toute modification touchant `lib/auth/`, les
  permissions ou les migrations.

---

## 12. Réponse à incident

1. **Contenir** — désactiver les comptes concernés, révoquer les clés compromises.
2. **Constater** — figer les journaux, relever l'ampleur.
3. **Notifier** — la direction sans délai ; l'ARTCI et les personnes concernées
   si des données personnelles ont fuité, dans les délais légaux applicables.
4. **Corriger** — appliquer le correctif, restaurer si nécessaire.
5. **Consigner** — compte rendu écrit, mesures préventives.

Contact interne à renseigner : `……………………`

---

## 13. Contrôle avant mise en production

- [ ] Toute Server Action commence par `exigerPermission`
- [ ] `getUser()` partout, aucun `getSession()` pour une décision d'accès
- [ ] `SUPABASE_SERVICE_ROLE_KEY` absente du bundle client — vérifié après build
- [ ] Tous les buckets Storage en privé, URL signées uniquement
- [ ] Double authentification imposée aux rôles privilégiés
- [ ] En-têtes de sécurité posés et vérifiés
- [ ] Limitation de débit active sur la connexion
- [ ] Sauvegardes activées, une restauration testée
- [ ] Aucune donnée sensible dans les journaux — audit manuel réalisé
- [ ] Déclaration ARTCI déposée
- [ ] Notice d'information remise aux employés
- [ ] Jeu de données de démonstration supprimé de la base de production
