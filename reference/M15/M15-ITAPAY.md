# M15 — ItaPay · Exécution et suivi des paiements

**Statut** : à cadrer · **Prérequis** : M6, M7, M14 · **Bloque** : rien
**Version cible** : `v1.2.0` · **Rédigé le** : 31 juillet 2026

> ⚠️ **Le module le plus dangereux du projet.**
>
> Tous les autres produisent des données. Celui-ci **fait sortir de
> l'argent**, sans intermédiaire humain entre le clic et le transfert.
>
> Une erreur de paie se corrige au mois suivant. Une erreur ici est
> irréversible passé trois jours — et souvent immédiatement, si le
> destinataire retire les fonds.
>
> Chaque règle de ce dossier existe contre ce risque.
>
> **`SECURITE-M15.md` en est le complément obligatoire** : huit interdits en
> dur, douze points de contrôle avant exploitation. Les deux se lisent
> ensemble.

---

## 1. Déploiement — **arrêté pour le développement, ouvert pour la production**

### 1.1 · La question de la liste blanche d'adresses IP

Wave permet de restreindre les appels à des adresses déclarées. C'est la
protection la plus efficace : **même une clé volée devient inutilisable
depuis ailleurs**.

Vercel et les Edge Functions Supabase exécutent sur des adresses
**dynamiques**. Il n'y a pas d'adresse fixe à déclarer.

### 1.2 · Pour le développement — appel direct depuis Vercel

**Décidé.** La clé de test ne donne accès qu'à un portefeuille de
démonstration, sans argent réel. Une fuite se règle par une révocation.

```
ITA Manager (Vercel)  →  Wave API (portefeuille de test)
```

Aucune infrastructure supplémentaire. La clé vit dans `.env.dev`, déjà
couvert par `.gitignore`.

> ⚠️ **Cela ne dispense d'aucune règle.** La signature HMAC, l'idempotence et
> tous les gardes-fous s'appliquent dès le développement. Un code qui
> « simplifie » en développement révèle ses défauts au moment le plus
> coûteux.

### 1.3 · Pour la production — trois voies, à trancher

| Voie | Coût | Effet |
| --- | --- | --- |
| **Signature HMAC seule** | nul | Une clé volée seule est inutilisable. Pas de liste blanche. |
| **Edge Function Supabase** | inclus | La clé quitte Vercel, vit dans Supabase Vault. Adresses toujours dynamiques. |
| **Passerelle dédiée** | ~4 €/mois | Adresse fixe, liste blanche possible. Un service de plus à maintenir. |

**Question à poser à Wave avant de trancher :**

> Nos appels partiront d'une infrastructure serverless, sans adresse IP fixe.
>
> 1. La liste blanche est-elle obligatoire pour un compte marchand en Côte
>    d'Ivoire, ou reste-t-elle optionnelle ?
> 2. Acceptez-vous une plage CIDR correspondant à une région cloud ?
> 3. La signature HMAC seule est-elle jugée suffisante ?

**Cette décision n'empêche pas de construire.** L'appel Wave est identique
dans les trois cas — seul l'endroit d'où il part change, et c'est une
variable de configuration.

### 1.4 · Signature des requêtes — **à activer dès la création de la clé**

Wave signe chaque requête en HMAC-SHA256, avec un secret distinct de la clé.

> ⚠️ **L'option ne s'active qu'à la création.** Elle ne peut pas être ajoutée
> ensuite — il faudrait révoquer la clé et en créer une autre.

À activer sur la clé de test **comme** sur celle de production. Sinon le
passage en production révélerait un code non signé.

### 1.5 · Deux portefeuilles, deux clés

| Environnement | Portefeuille | Préfixe de clé |
| --- | --- | --- |
| Développement | Wave de test | `wave_ci_test_…` |
| Production | Wave réel | `wave_ci_prod_…` |

**Le code refuse de démarrer** si l'environnement et le préfixe ne
correspondent pas. Voir `SECURITE-M15.md` § 1.2.

### 1.6 · Offres gratuites — deux limites connues

| Limite | Contournement |
| --- | --- |
| Tâches planifiées Vercel : **une fois par jour** sur Hobby | `pg_cron` chez Supabase, sans limite de fréquence |
| Plan Hobby : **usage commercial interdit** | Passage sur Pro à la mise en exploitation — décision G-08 |

La première compte pour M15 : la reprise des paiements en état inconnu doit
être **horaire**, pas quotidienne.

---

## 2. Décisions arrêtées

### 2.1 · Périmètre d'exécution

Le module **exécute** trois catégories de paiements :

| Catégorie | Source | Destinataire |
| --- | --- | --- |
| **Journaliers** | Périodes de paie chantier — M7 | Numéro Wave de l'employé |
| **Fournisseurs** | Factures d'achat — M14 | Numéro Wave du fournisseur |
| **Besoins urgents** | Demande ponctuelle | Numéro Wave d'un agent |

**Hors périmètre** : les permanents, payés par virement bancaire. M15 produit
leur fichier de virement, il ne l'exécute pas.

**Hors périmètre également** : les avances sur salaire et les prêts. Décision
prise — ITA ne les gère pas dans l'application.

### 2.2 · Circuit d'autorisation — **arrêté**

```
1. Le DFC prépare le paiement ou le lot
2. Il demande l'autorisation      → notification au DG, par courriel
3. Le DG ouvre l'application
   Il voit : bénéficiaire, montant, motif, source
4. Il clique « Autoriser »
5. L'application lui demande son code TOTP
   Il le lit sur son téléphone, il le saisit
6. Le paiement est débloqué       → fenêtre d'exécution ouverte
7. Le DFC exécute
```

> **Le DG ne transmet aucun code.** Il lit son TOTP sur son propre téléphone
> et le saisit sur son propre écran. C'est ce qui prouve que c'est lui.

#### Pourquoi pas un code transmis

Le mécanisme initialement envisagé — le DG génère un code, le transmet au
DFC, valide 24 h — a été écarté. Quatre raisons :

| Point | Code transmis | TOTP dans l'application |
| --- | --- | --- |
| Qui le connaît | DG **et** DFC — il circule | Le DG seul |
| Ce que le DG voit | **Rien** — il génère à l'aveugle | Bénéficiaire, montant, motif |
| Durée de vie | 24 h | 30 secondes |
| Qui autorise réellement | **Le DFC, muni d'un code** | Le DG |

Le deuxième point est le plus grave : autoriser sans voir ce qu'on autorise
n'est pas une autorisation.

C'est le périmètre exact de l'accès mobile prévu par la décision E-09 —
recevoir et valider entre deux réunions.

### 2.3 · Fenêtre d'exécution — **arrêtée**

| Paramètre | Valeur |
| --- | --- |
| `paiement.dureeAutorisation` | **2 heures**, plafond 4 h |
| `paiement.heureOuverture` | **8 h 00** |
| `paiement.heureLimite` | **14 h 00** |
| `paiement.joursOuvrables` | **Lundi au vendredi** |

**Une autorisation ne peut jamais dépasser 14 h.** Si le DG autorise à
13 h 30, la fenêtre est de trente minutes. L'écran l'affiche au moment de la
demande.

**Après 14 h, aucune demande d'autorisation n'est possible.** Le bouton se
désactive avec sa raison — inutile de solliciter le DG pour un paiement qui
ne partira pas.

**Le lendemain n'est pas toujours demain.** Vendredi 14 h → lundi 8 h. Un
jour férié décale encore. Le calendrier de M3 sert ici.

#### Le montant est figé à la demande

Si le montant change entre l'autorisation et l'exécution, **l'autorisation
tombe**. Sinon le DG autoriserait 800 000 F et le DFC exécuterait 8 000 000 F.

#### Échec technique

Une autorisation reste valide pour un second essai **pendant sa fenêtre**,
avec un compteur. Au-delà de **trois échecs**, elle se bloque et le DG doit
reconfirmer — trois échecs signalent autre chose qu'un incident réseau.

### 2.4 · Paiement urgent après 14 h — **arrêté**

Le paiement se **prépare** et part **automatiquement au premier créneau
ouvrable**. Pas de dérogation, pas de contournement.

L'écran l'annonce : « Ce paiement sera exécuté lundi 4 août à 8 h 00 ».

---

## 3. Ce que l'API Wave impose

### 3.0 · Sources

| Ressource | Adresse |
| --- | --- |
| **Payout API** — paiements sortants, la page qui compte | `https://docs.wave.com/payout` |
| Business API — référence générale | `https://docs.wave.com/business#api-reference` |
| Portail marchand — clés, signature, liste blanche | `https://business.wave.com/dev-portal` |
| Copie locale | `reference/m15/wave/` |

**Ne pas s'appuyer sur la mémoire pour cette API.** Peu représentée dans les
données d'entraînement, elle se prête aux champs inventés qui semblent
plausibles.

Les éléments ci-dessous ont été **vérifiés contre la documentation** le
31 juillet 2026. Si elle dit autre chose, signaler l'écart.

### 3.0 bis · Points d'entrée

| Méthode | Chemin | Nature |
| --- | --- | --- |
| `POST` | `/v1/payout` | Paiement unitaire — **synchrone** |
| `GET` | `/v1/payout/:id` | Consulter un paiement |
| `GET` | `/v1/payouts/search?client_reference=…` | **Rechercher** — avant tout rejeu |
| `POST` | `/v1/payout-batch` | Lot — **asynchrone** |
| `GET` | `/v1/payout-batch/:id` | Consulter un lot |
| `POST` | `/v1/payout/:id/reverse` | Annuler — 3 jours maximum |
| `POST` | `/v1/verify_recipient` | Vérifier un destinataire |

Base : `https://api.wave.com`

### 3.0 ter · En-têtes

```
Authorization:   Bearer wave_ci_test_… ou wave_ci_prod_…
Content-Type:    application/json
Idempotency-Key: <uuid v4>            obligatoire sur tout POST
Wave-Signature:  t={timestamp},v1={hmac}
```

**Signature** : `HMAC-SHA256(timestamp + corps_brut, secret)`.
Fenêtre acceptée : cinq minutes dans le passé, trente secondes dans le futur.

Pour un `GET` sans corps, le contenu signé est le seul timestamp.


### 3.1 · L'idempotence — la règle qui évite le double paiement

**Chaque requête modifiante exige un en-tête `Idempotency-Key`.**

Wave garantit : *plusieurs requêtes portant la même clé n'enverront jamais
l'argent deux fois.*

| Situation | Clé |
| --- | --- |
| Nouvelle tentative du **même** paiement | **La même clé** |
| Nouveau paiement, même montant, même destinataire | **Une nouvelle clé** |

> ⚠️ **Wave l'écrit noir sur blanc** : deux requêtes au corps identique mais
> aux clés différentes produiront **deux transferts**.

**Règle pour M15** : la clé est un UUID v4 généré **à la création de la ligne
de paiement**, stocké en base, réutilisé à chaque tentative. Jamais généré au
moment de l'appel.

### 3.2 · Une erreur système n'est PAS un échec

C'est le point le plus contre-intuitif de l'API, et le plus coûteux si on se
trompe.

| Réponse | Statut à écrire |
| --- | --- |
| `408`, `500`, `503`, tout `5xx` | **`EN_ATTENTE`** — l'état est inconnu |
| Délai dépassé, coupure réseau | **`EN_ATTENTE`** |
| `429` — trop de requêtes | **`EN_ATTENTE`**, réessayer plus tard |
| Erreur de validation, solde insuffisant, limite atteinte | `ECHOUE` — définitif |

> **Wave prévient** : marquer un paiement comme échoué alors qu'il est en
> réalité en cours conduit à le rejouer — et à envoyer l'argent deux fois.

Un paiement `EN_ATTENTE` se réessaie avec la **même clé d'idempotence**, en
espaçant progressivement les tentatives.

### 3.3 · Vérifier le destinataire avant de payer

L'API expose `POST /v1/verify_recipient` — elle dit si le numéro correspond à
un compte Wave, si le nom concorde, et si le montant passera les plafonds du
destinataire.

**Obligatoire avant tout paiement dans M15.**

| Réponse | Effet |
| --- | --- |
| `name_match: MATCH` | Poursuivre |
| `name_match: NO_MATCH` | **Bloquer.** Le numéro appartient à quelqu'un d'autre. |
| `name_match: NAME_NOT_KNOWN` | Avertir. Compte non vérifié chez Wave. |
| `within_limits: false` | **Bloquer.** Le plafond mensuel du destinataire est atteint. |

**C'est le contrôle qui rattrape une faute de frappe** dans un numéro Wave —
le risque signalé depuis M2.

> Limite à connaître : trente vérifications par numéro sur cinq minutes, puis
> blocage d'une heure. Ne pas vérifier en boucle.

### 3.4 · Lot ou paiement unitaire

| | Unitaire | Lot |
| --- | --- | --- |
| Endpoint | `POST /v1/payout` | `POST /v1/payout-batch` |
| Exécution | **Synchrone** — résultat immédiat | **Asynchrone** — un identifiant, puis interrogation |
| Emploi dans M15 | Fournisseur, besoin urgent | **Paie des journaliers** |

Pour un lot, Wave ne renvoie pas de statut global : **chaque paiement doit
être inspecté individuellement**. Certains réussissent, d'autres échouent.

Interroger toutes les quelques secondes jusqu'à ce que le lot passe à
`complete`.

### 3.5 · Annulation — trois jours

`POST /v1/payout/:id/reverse` annule un paiement, frais compris, **dans les
trois jours** suivant sa création.

L'appel est idempotent : annuler deux fois ne crée pas deux mouvements.

**À exposer dans M15**, avec motif obligatoire et journalisation. C'est le
seul filet après exécution.

### 3.6 · Formats

| Élément | Contrainte |
| --- | --- |
| Montant | Chaîne, **entier sans décimale**, positif |
| Devise | `XOF` — jamais `CFA` |
| Téléphone | E.164 — `+2250712345678` |
| `payment_reason` | 40 caractères, **visible du destinataire** |
| `client_reference` | 255 caractères — y mettre la référence ITA |

`client_reference` permet de retrouver un paiement dans Wave depuis une
référence ITA. **À renseigner systématiquement** : c'est ce qui rend le
rapprochement possible.

---

## 4. Écrans

| Écran | Route | Permission | Compteur |
| --- | --- | --- | --- |
| Tableau de bord | `/paiements` | `paiement:consulter` | — |
| À préparer | `/paiements/a-preparer` | `paiement:preparer` | 🔴 |
| Demandes d'autorisation | `/paiements/autorisations` | `paiement:autoriser` | 🔴 |
| Exécution | `/paiements/executer` | `paiement:executer` | 🔴 |
| Relevés | `/paiements/releves` | `paiement:consulter` | — |
| Anomalies | `/paiements/anomalies` | `paiement:preparer` | 🔴 |
| Solde du portefeuille | `/paiements/portefeuille` | `paiement:consulter` | — |

### 4.1 · Écran d'autorisation — le plus important

C'est le seul écran que le DG utilisera. Il doit tenir sur un téléphone.

```
┌─────────────────────────────────┐
│ Autorisation de paiement        │
│                                 │
│ Paie journaliers — Bouaké Nord  │
│ Période du 15 au 31 juillet     │
│                                 │
│ 17 bénéficiaires                │
│ 2 847 000 F                     │
│                                 │
│ Demandé par Marc OUATTARA       │
│ Le 31/07 à 09 h 14              │
│                                 │
│ [ Voir le détail ]              │
│                                 │
│ ⏱ Fenêtre : 2 h après validation│
│    Exécution avant 14 h 00      │
│                                 │
│ [ Refuser ]     [ Autoriser ]   │
└─────────────────────────────────┘
```

Après « Autoriser » : saisie du TOTP, six chiffres.

**Le détail est consultable, jamais masqué.** Un DG qui autorise sans pouvoir
voir la liste des bénéficiaires n'autorise rien.

### 4.2 · Écran d'anomalies

Tout ce qui a échoué ou reste en attente. C'est l'écran qu'on ouvre en
premier chaque matin.

| Anomalie | Signal |
| --- | --- |
| Paiement `EN_ATTENTE` depuis plus d'une heure | Ambre — état inconnu |
| Échec `recipient-limit-exceeded` | Ambre — le destinataire doit relever son plafond |
| Échec `recipient-account-blocked` | Rouge — compte bloqué |
| `name_match: NO_MATCH` | **Rouge — numéro suspect, ne pas payer** |
| Solde du portefeuille insuffisant | Rouge — bloque tout |

---

## 5. Modèle de données

`DemandePaiement` · `LignePaiement` · `AutorisationPaiement` ·
`TentativePaiement` · `ReleveePaiement` · `PortefeuilleWave`

### 5.1 · La ligne fige tout

```prisma
model LignePaiement {
  id                  String   @id @default(uuid())
  demandePaiementId   String

  /// Clé d'idempotence — générée À LA CRÉATION, jamais à l'appel
  cleIdempotence      String   @unique @default(uuid())

  /// Copies figées — le bénéficiaire peut changer de numéro ensuite
  beneficiaireNom     String
  beneficiaireMobile  String   /// E.164
  montant             Decimal  /// Entier, XOF
  motifPaiement       String   /// 40 caractères max, visible du destinataire
  referenceIta        String   /// → client_reference

  /// Vérification préalable
  verifieLe           DateTime?
  nameMatch           NameMatch?
  withinLimits        Boolean?

  /// Résultat
  statut              StatutPaiement
  wavePayoutId        String?
  waveErrorCode       String?
  fraisWave           Decimal?
  executeLe           DateTime?

  tentatives          TentativePaiement[]
}

enum StatutPaiement {
  PREPARE
  VERIFIE
  AUTORISE
  EN_COURS
  EN_ATTENTE      /// État inconnu — NE JAMAIS rejouer sans la même clé
  REUSSI
  ECHOUE
  ANNULE
}
```

> **`cleIdempotence` en `@default(uuid())` sur le modèle**, jamais générée
> dans le code d'appel. C'est ce qui garantit qu'une nouvelle tentative
> réutilise la même.

### 5.2 · Chaque tentative est enregistrée

```prisma
model TentativePaiement {
  lignePaiementId String
  numero          Int
  envoyeeLe       DateTime
  httpStatus      Int?
  reponseBrute    Json     /// Réponse Wave complète
  erreurCode      String?
}
```

**La réponse brute est conservée.** En cas de litige avec Wave ou avec un
bénéficiaire, c'est la seule preuve.

### 5.3 · L'autorisation

```prisma
model AutorisationPaiement {
  demandePaiementId String   @unique
  demandeeParId     String
  demandeeLe        DateTime

  autoriseeParId    String?
  autoriseeLe       DateTime?
  expireLe          DateTime?   /// = autoriseeLe + durée, plafonné à 14 h

  montantFige       Decimal     /// Si le montant change, l'autorisation tombe
  nombreEchecs      Int      @default(0)

  refuseeLe         DateTime?
  motifRefus        String?
}
```

---

## 6. Permissions

| Permission | Portée | Rôles |
| --- | --- | --- |
| `paiement:consulter` | Relevés, solde, tableau de bord | ADMIN, DG, DFC |
| `paiement:preparer` | Constituer une demande | ADMIN, DFC |
| `paiement:autoriser` | **Autoriser** — TOTP obligatoire | **DG seul** |
| `paiement:executer` | Déclencher l'exécution | ADMIN, DFC |
| `paiement:annuler` | Annuler sous 3 jours | ADMIN, DFC + autorisation DG |
| `paiement:parametres` | Seuils, horaires | ADMIN |

### 6.1 · Trois interdits en dur

**Celui qui prépare ne peut pas autoriser.** Même si un compte cumulait les
deux permissions.

**Le DG ne peut pas exécuter.** Il autorise ; le DFC exécute. La séparation
est le contrôle.

**`paiement:autoriser` exige un TOTP actif.** Un compte sans second facteur
ne peut pas autoriser, même avec la permission.

---

## 7. Server Actions

| Action | Permission | Contrôles |
| --- | --- | --- |
| `preparerDemande` | `paiement:preparer` | Source valide, bénéficiaires avec numéro Wave |
| `verifierBeneficiaires` | `paiement:preparer` | Appelle `verify_recipient` pour chaque ligne |
| `demanderAutorisation` | `paiement:preparer` | Avant 14 h, montant figé, notification DG |
| `autoriserPaiement` | `paiement:autoriser` | **TOTP obligatoire**, non-préparateur, avant 14 h |
| `refuserPaiement` | `paiement:autoriser` | Motif obligatoire |
| `executerPaiement` | `paiement:executer` | Autorisation valide, non expirée, montant inchangé |
| `interrogerLot` | `paiement:executer` | Interroge Wave jusqu'à `complete` |
| `annulerPaiement` | `paiement:annuler` | Moins de 3 jours, motif, autorisation DG |
| `consulterSolde` | `paiement:consulter` | — |

### 7.1 · `executerPaiement` — les sept contrôles

Avant tout appel à Wave :

1. L'autorisation existe et n'est pas expirée
2. Le montant total est **identique** au montant figé
3. L'heure est entre 8 h et 14 h, un jour ouvrable
4. Chaque bénéficiaire a été vérifié, sans `NO_MATCH`
5. Le solde du portefeuille couvre le total, frais compris
6. Le nombre d'échecs est inférieur à trois
7. L'appelant n'est pas celui qui a autorisé

**Un seul contrôle qui échoue arrête tout.** Pas d'exécution partielle.

### 7.2 · La clé Wave ne quitte jamais le serveur

Même exigence que `SUPABASE_SERVICE_ROLE_KEY` — `SECURITE.md` § 4.

Jamais de préfixe `NEXT_PUBLIC_`, jamais dans un composant client, jamais
dans une réponse d'API.

Si la passerelle de la section 1.1 est retenue, la clé **n'existe même pas
sur Vercel**.

---

## 8. Règles métier

### 8.1 · Aucun paiement sans vérification préalable

`verify_recipient` est appelé pour **chaque ligne**, avant la demande
d'autorisation. Un `NO_MATCH` bloque la ligne — pas tout le lot, mais celle-là.

### 8.2 · Le solde est contrôlé avant d'autoriser

Le DG ne doit pas autoriser un paiement que le portefeuille ne peut pas
couvrir. Le solde est affiché sur l'écran d'autorisation.

### 8.3 · Un relevé par paiement exécuté

`ReleveePaiement` contient : bénéficiaire, montant, frais, identifiant Wave,
horodatage, référence ITA, autorisation associée.

**Exportable en tableau et en PDF.** C'est la pièce comptable.

### 8.4 · Rapprochement quotidien

La tâche quotidienne de M10 ajoute une étape : interroger Wave pour tous les
paiements `EN_ATTENTE` de plus d'une heure et mettre à jour leur statut.

Un paiement qui reste `EN_ATTENTE` plus de 24 h apparaît en anomalie
critique.

### 8.5 · Jamais de rejeu automatique

Un paiement `EN_ATTENTE` n'est **jamais** rejoué automatiquement. Il est
d'abord **interrogé** — `GET /v1/payout/:id` ou recherche par
`client_reference`.

S'il a réussi, on met à jour. S'il n'existe pas chez Wave, alors seulement on
rejoue, avec la même clé.

### 8.6 · Le motif est visible du destinataire

`payment_reason`, 40 caractères, apparaît sur le reçu Wave du bénéficiaire.

Format proposé : `ITA - Paie 15-31 juil. 2026` · `ITA - Facture FA-2026-0912`

**Rien de confidentiel.** Ni matricule, ni nom de chantier sensible.

### 8.7 · Un paiement de lot en processing persistant

Après cinq interrogations — environ trente secondes — un paiement qui reste
en `processing` passe en EN_ATTENTE et rejoint la file de reprise horaire.

**Motif :** Wave résout normalement un paiement en quelques secondes. Au-delà,
l'état devient incertain et relève du même traitement qu'une erreur serveur.

---

## 9. Critères de recette

### Sécurité

- [ ] La clé Wave n'apparaît dans aucun fichier du bundle client
- [ ] Le code refuse de démarrer avec une clé de production en développement
- [ ] La signature HMAC est activée et vérifiée
- [ ] **Un compte sans TOTP ne peut pas autoriser**, même avec la permission
- [ ] **Celui qui prépare ne peut pas autoriser**
- [ ] **Le DG ne peut pas exécuter**
- [ ] `autoriserPaiement` appelée sans TOTP, en POST direct, est refusée

### Idempotence

- [ ] La clé est générée à la création de la ligne, pas à l'appel
- [ ] Une nouvelle tentative réutilise **la même clé**
- [ ] **Deux paiements identiques créés séparément ont des clés différentes**
- [ ] Rejouer une ligne réussie ne crée pas de second transfert

### Vérification

- [ ] `verify_recipient` est appelé pour chaque ligne
- [ ] **Un `NO_MATCH` bloque la ligne**
- [ ] `within_limits: false` bloque la ligne
- [ ] Un `NAME_NOT_KNOWN` avertit sans bloquer
- [ ] La vérification n'est pas rejouée en boucle — limite Wave

### Fenêtre

- [ ] Une demande après 14 h est refusée, avec sa raison
- [ ] Une autorisation à 13 h 30 expire à 14 h, non à 15 h 30
- [ ] Une autorisation expirée bloque l'exécution
- [ ] Un samedi, aucune exécution n'est possible
- [ ] **Un montant modifié après autorisation fait tomber l'autorisation**
- [ ] Trois échecs bloquent l'autorisation

### Traitement des erreurs

- [ ] Une réponse `500` écrit **`EN_ATTENTE`**, jamais `ECHOUE`
- [ ] Un délai dépassé écrit `EN_ATTENTE`
- [ ] `insufficient-funds` écrit `ECHOUE`
- [ ] `recipient-limit-exceeded` écrit `ECHOUE` avec son message
- [ ] **Un `EN_ATTENTE` est interrogé avant tout rejeu**
- [ ] La réponse brute de Wave est conservée

### Lots

- [ ] Un lot de vingt journaliers s'exécute
- [ ] Chaque paiement est inspecté individuellement
- [ ] Un échec partiel n'annule pas les réussites
- [ ] Le reliquat se rejoue dans un second lot, nouvelle autorisation

### Relevés

- [ ] Un relevé est produit par paiement exécuté
- [ ] Il contient l'identifiant Wave et les frais
- [ ] L'export PDF est exploitable comme pièce comptable
- [ ] Le total du relevé correspond aux transferts réels

### Build

- [ ] `npx tsc --noEmit` et `npm run build` passent
- [ ] `scripts/verify-m15.ts` couvre au minimum : idempotence, traitement `5xx`, fenêtre horaire

---

## 10. Tests avec le portefeuille de démonstration

**Aucun développement contre le portefeuille de production.**

| Test | Attendu |
| --- | --- |
| Paiement vers un numéro valide | `succeeded` |
| Même clé, second appel | Aucun second transfert |
| Clé différente, corps identique | **Deux transferts** — à ne jamais reproduire |
| Numéro inexistant | `NAME_NOT_KNOWN` à la vérification |
| Montant supérieur au solde | `insufficient-funds` |
| Lot avec un numéro invalide | Les autres passent, celui-là échoue |
| Annulation à J+1 | Réussie |
| Annulation à J+4 | `payout-reversal-time-limit-exceeded` |

---

## 11. Points de vigilance

1. **La liste blanche d'adresses IP est incompatible avec Vercel.** Section 1.1 — à trancher avant tout code.
2. **L'idempotence évite le double paiement.** Clé générée à la création, jamais à l'appel.
3. **Une erreur `5xx` n'est pas un échec.** C'est un état inconnu. Le traiter comme un échec fait payer deux fois.
4. **Vérifier avant de payer.** `verify_recipient` rattrape la faute de frappe dans un numéro.
5. **Le DG voit ce qu'il autorise.** Sinon ce n'est pas une autorisation.
6. **Préparer, autoriser, exécuter : trois gestes, deux personnes.**
7. **Trois jours pour annuler.** Après, l'argent est parti.
8. **La clé Wave ne quitte jamais le serveur.** Une clé volée vide le portefeuille.

---

## 12. Paramètres de configuration

Stockés dans la table `Parametre`, modifiables par ADMIN via l'écran
d'administration.

| Clé | Valeur par défaut | Description |
| --- | --- | --- |
| `paiement.heureOuverture` | `8` | Heure d'ouverture du créneau d'exécution |
| `paiement.heureLimite` | `14` | Heure de fermeture du créneau d'exécution |
| `paiement.dureeAutorisation` | `120` | Durée de validité d'une autorisation (minutes) |

**L'autorisation ne dépasse jamais `heureLimite`** (SECURITE-M15.md § 6.2).
Une autorisation donnée à 13 h 30 expire à 14 h, non à 15 h 30.

**Les jours fériés viennent de M3.** Si la table `JourFerie` est vide, le
créneau reste ouvert — le module fonctionne sans, et mieux avec.

---

## 13. Ce qui ne se décide pas seul

1. La stratégie de déploiement de la section 1
2. Toute modification du circuit d'autorisation
3. Les horaires et la durée de fenêtre
4. Le traitement d'un code d'erreur Wave
5. L'ajout d'une catégorie de paiement
6. Tout ce qui touche à la génération ou au stockage de la clé d'idempotence

---

## 14. Plan de livraison

Trois tranches. Chacune se teste et se met en service séparément.

### Livraison 1 — Le circuit, sans exécution réelle

**Objectif** : le circuit d'autorisation fonctionne, avec un client Wave
simulé. Aucun appel réel.

| # | Étape | Ce que je vérifie |
| --- | --- | --- |
| 1.1 | Modèle et migration — 6 tables, 4 enums | `npm run verify` passe |
| 1.2 | Client Wave avec **client simulé** — signature, idempotence, aiguillage d'erreurs | `test-idempotence.ts` passe, **vu échouer** |
| 1.3 | Server Actions — préparer, vérifier, demander, autoriser, exécuter | Les 8 interdits sont vérifiés côté serveur |
| 1.4 | Écran de préparation | Les bénéficiaires bloqués ressortent |
| 1.5 | **Écran d'autorisation du DG** — hors coquille, 420 px | S'affiche correctement sur téléphone |
| 1.6 | Écran d'exécution | Bandeau permanent, confirmation explicite |

**Le client simulé est le point clé.** Il rejoue les réponses de Wave —
succès, `NO_MATCH`, `insufficient-funds`, `503` — sans rien envoyer. C'est ce
qui permet de tester tous les cas d'erreur sans portefeuille.

### Livraison 2 — Exécution réelle sur le portefeuille de test

| # | Étape |
| --- | --- |
| 2.1 | Client Wave réel, clé de test |
| 2.2 | `verify_recipient` |
| 2.3 | Paiement unitaire — fournisseur, besoin urgent |
| 2.4 | Reprise des paiements en état inconnu — recherche avant rejeu |
| 2.5 | Relevés de paiement, export |

### Livraison 3 — Lots et annulation

| # | Étape |
| --- | --- |
| 3.1 | Lots — paie des journaliers, interrogation asynchrone |
| 3.2 | Annulation sous trois jours |
| 3.3 | Écran d'anomalies |
| 3.4 | Tableau de bord et solde |

---

## 14. Protocole d'exécution

### Avant d'écrire une ligne

- [ ] Lire `M15-ITAPAY.md` en entier
- [ ] Lire **`SECURITE-M15.md`** en entier — il n'est pas optionnel
- [ ] Lire `reference/m15/ApercuItaPay.jsx`
- [ ] `npm run verify` passe au vert
- [ ] Créer le portefeuille de test Wave et sa clé, **avec signature activée**
- [ ] Proposer un plan découpé, attendre validation

### À chaque étape

- [ ] Vérifier les composants shadcn requis avant d'écrire l'écran
- [ ] Écrire le code
- [ ] `npx tsc --noEmit` puis `npm run build`
- [ ] Montrer la **sortie brute** de ce qui établit la conformité
- [ ] Attendre validation avant l'étape suivante

### Avant de clore une livraison

- [ ] Les critères de recette de la section 9
- [ ] Les douze points de contrôle de `SECURITE-M15.md` § 9
- [ ] `scripts/verify-m15.ts` écrit, exécuté, **vu échouer** une fois
- [ ] Ajouté à `verify-all.ts`
- [ ] Les huit commandes de rendu, sur le périmètre M15

### Ce qui ne se décide pas seul

1. La voie de déploiement en production — section 1.3
2. Toute modification du circuit d'autorisation
3. Les horaires et la durée de fenêtre
4. Le classement d'un code d'erreur Wave en `ECHOUE` ou `EN_ATTENTE`
5. L'ajout d'une catégorie de paiement
6. **Tout ce qui touche à la génération ou au stockage de la clé d'idempotence**
7. Le retrait ou l'assouplissement d'un des huit interdits

---

## 15. Les cinq erreurs qui coûteraient de l'argent

Rappelées ici parce qu'elles sont les seules irréversibles.

**Générer la clé d'idempotence au moment de l'appel.** Chaque tentative
devient un transfert. Elle se génère à la création de la ligne — un
`@default(uuid())` sur le modèle.

**Écrire `ECHOUE` sur une réponse `5xx`.** L'état est inconnu, pas échoué.
Le rejeu envoie l'argent une seconde fois.

**Rejouer sans chercher d'abord.** Wave protège par l'idempotence, mais on ne
s'appuie pas sur une seule protection quand il s'agit d'argent.

**Sauter `verify_recipient`.** C'est le seul contrôle qui rattrape un chiffre
inversé dans un numéro Wave.

**Laisser une même personne préparer et autoriser.** Le principe des quatre
yeux est le garde-fou le plus élémentaire, et le plus facile à contourner par
inadvertance.
