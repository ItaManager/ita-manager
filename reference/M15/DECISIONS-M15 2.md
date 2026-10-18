# DECISIONS-M15.md — Décisions applicables à ItaPay

> **Extrait de `DECISIONS.md`.** Ce fichier ne remplace pas le registre — il
> rassemble ce qui concerne M15 pour éviter d'en lire cinquante entrées.
>
> **En cas de contradiction, `DECISIONS.md` fait foi.**

---

## Propres à M15

### D-13 · Autorisation des paiements par TOTP, non par code transmis — **Arrêtée**

Le Directeur Financier prépare un paiement, le Directeur Général l'autorise
**dans l'application**, avec son second facteur TOTP.

**Le DG ne transmet aucun code.** Il lit son TOTP sur son propre téléphone et
le saisit sur son propre écran.

#### Ce qui a été écarté

Le mécanisme initialement envisagé — le DG génère un code, le transmet au
DFC, valide 24 h — pose quatre problèmes :

| Point | Code transmis | TOTP dans l'application |
| --- | --- | --- |
| Qui le connaît | DG **et** DFC — il circule | Le DG seul |
| Ce que le DG voit | **Rien** — il génère à l'aveugle | Bénéficiaire, montant, motif |
| Durée de vie | 24 h | 30 secondes |
| Qui autorise réellement | **Le DFC, muni d'un code** | Le DG |

Le deuxième point est le plus grave : **autoriser sans voir ce qu'on autorise
n'est pas une autorisation.**

C'est le périmètre exact de l'accès mobile prévu par E-09 — recevoir et
valider entre deux réunions.

### D-14 · Fenêtre et créneau de paiement — **Arrêtée**

| Paramètre | Valeur |
| --- | --- |
| Durée de l'autorisation | **2 heures**, plafond 4 h |
| Heure d'ouverture | **8 h 00** |
| Heure limite | **14 h 00** |
| Jours ouvrables | **Lundi au vendredi** |

**Une autorisation ne dépasse jamais 14 h.** Donnée à 13 h 30, elle expire à
14 h — non à 15 h 30.

**Après 14 h, aucune demande n'est possible.** Un paiement urgent se prépare
et part **automatiquement au premier créneau ouvrable**. Pas de dérogation :
une exception ouverte devient la règle.

**Le montant est figé à la demande.** S'il change, l'autorisation tombe.

**Trois échecs bloquent** l'autorisation — le DG doit reconfirmer.

### D-15 · Séparation des trois gestes de paiement — **Arrêtée**

Préparer, autoriser, exécuter sont trois gestes distincts, portés par
**deux personnes au minimum**.

| Interdit en dur | Ce qu'il évite |
| --- | --- |
| Celui qui prépare ne peut pas autoriser | Une personne seule qui s'envoie de l'argent |
| Celui qui autorise ne peut pas exécuter | La même chose, dans l'autre sens |
| Autoriser sans TOTP actif | Un compte compromis qui autorise |

Vérifiés **côté serveur**, non désactivables, indépendants de toute
permission. Même si un compte cumulait les droits, le contrôle reste.

Détail dans `SECURITE-M15.md` § 1.

---

## E — Conventions d'interface

---

## Héritées d'autres modules

### A-12 · Le numéro Wave est une donnée de paiement — **rappel de M2**

Le numéro de transfert d'argent mobile est **distinct du téléphone de
contact**. Les deux peuvent différer.

C'est une donnée **sensible** au sens de `SECURITE.md` § 2 : une erreur de
saisie envoie l'argent à un tiers, sans recours.

→ Double confirmation à la saisie, modification journalisée.

**Ce que M15 y ajoute** : `verify_recipient` de l'API Wave vérifie que le
numéro correspond bien au nom déclaré. C'est le contrôle qui rattrape la
faute de frappe **avant** que l'argent parte.

### E-09 · Accès mobile du Directeur Général — **rappel de M10**

**Périmètre strict : recevoir et valider.** Pas de tableaux de bord, pas de
saisie, pas de navigation.

| Élément | Choix |
| --- | --- |
| Forme | **Web adaptatif**, pas d'application native |
| Écrans | Liste des éléments en attente · fiche de décision |
| Authentification | Identique au bureau, second facteur compris |

**L'écran d'autorisation de paiement de M15 relève de ce périmètre.** Il sort
de la coquille applicative : ni menu, ni barre latérale, 420 px de large. Le
DG l'ouvre depuis un courriel, décide, et ferme.

### B-05 · Auto-approbation interdite en dur — **rappel transverse**

Personne ne valide sa propre demande. En dur, non paramétrable.

**Ce que M15 y ajoute** : la séparation va plus loin — trois gestes, deux
personnes. Voir D-15.

### B-06 · Relances par courriel selon l'urgence — **rappel transverse**

| Urgence | Délai de relance |
| --- | --- |
| Critique | 24 h |
| Haute | 3 jours |
| Normale | 5 jours |

**Ce que M15 y ajoute** : une demande d'autorisation non traitée est
**critique**. Elle bloque un paiement, souvent des salaires.

### D-09 · Tâches planifiées — **rappel transverse**

Vercel Cron, une route protégée par `CRON_SECRET`, exécution quotidienne à
6 h UTC.

> ⚠️ **M15 fait exception.** La reprise des paiements en état inconnu doit
> être **horaire**, pas quotidienne. Or le plan Hobby de Vercel limite les
> tâches à une exécution par jour.
>
> Contournement : `pg_cron` chez Supabase, sans limite de fréquence.

### E-01 · Pagination — **rappel transverse**

Pagination **serveur**, 25 lignes, état dans l'URL. Le journal d'audit et les
relevés de paiement en pagination **par curseur**.

---

## Règles d'interface applicables

Toutes s'appliquent — `PATRONS.md`, `TYPOGRAPHIE.md`, `CHAMPS.md`.

Trois méritent une attention particulière sur ce module.

**R-01 · Aucune information ne repose sur la seule couleur.** Un montant en
rouge porte toujours un libellé — « retard 12 j », « état inconnu ». Sur un
écran de paiement, une pastille sans texte est un risque.

**R-05 · Étapes pour créer, onglets pour modifier.** La préparation d'une
demande de paiement suit le patron 4 bis.

**R-07 · Les états des champs sont spécifiés.** En particulier : une valeur
masquée par permission porte un cadenas et le mot « masqué », jamais une
cellule vide.

---

## Décisions en attente qui concernent M15

| # | Sujet | Bloque |
| --- | --- | --- |
| **G-08** | Passage aux offres payantes Vercel et Supabase | La reprise horaire, l'usage commercial |
| **G-10** | Déploiement — liste blanche Wave, signature seule, ou passerelle dédiée | M15 en **production** seulement |

**Ni l'une ni l'autre n'empêche de construire.** L'appel Wave est identique
dans tous les cas — seul l'endroit d'où il part change.
