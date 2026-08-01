# SECURITE-M15.md — Gardes-fous de l'exécution des paiements

**Complète `SECURITE.md`.** Ce document ne vaut que pour M15 — le seul module
qui fait sortir de l'argent.

| Ressource | Adresse |
| --- | --- |
| Payout API | `https://docs.wave.com/payout` |
| Business API | `https://docs.wave.com/business#api-reference` |
| Portail marchand — clés, signature, liste blanche | `https://business.wave.com/dev-portal` |

> Les autres modules produisent des données. Une erreur s'y corrige.
>
> Ici, une erreur **envoie de l'argent à quelqu'un**, et devient
> irrécupérable en trois jours — souvent avant, si le destinataire retire les
> fonds.
>
> Chaque garde-fou de ce document existe parce qu'il a un coût connu s'il
> manque.

---

## 1. Les huit interdits en dur

Vérifiés **côté serveur**, non désactivables, non paramétrables. Ils ne
relèvent d'aucune permission : ils protègent d'un geste irréversible.

| # | Interdit | Ce qu'il évite |
| --- | --- | --- |
| **1** | Celui qui prépare ne peut pas autoriser | Une personne seule qui s'envoie de l'argent |
| **2** | Celui qui autorise ne peut pas exécuter | La même chose, dans l'autre sens |
| **3** | Autoriser sans TOTP actif | Un compte compromis qui autorise |
| **4** | Exécuter avec une autorisation expirée | Un paiement autorisé pour une situation qui n'existe plus |
| **5** | Exécuter si le montant a changé depuis l'autorisation | Autoriser 800 000 F, exécuter 8 000 000 F |
| **6** | Exécuter hors créneau — 8 h à 14 h, jours ouvrables | Un paiement lancé la nuit, sans témoin |
| **7** | Exécuter une ligne non vérifiée par `verify_recipient` | Un chiffre inversé dans un numéro |
| **8** | Démarrer avec une clé de production en développement | Payer réellement pendant un test |

### 1.1 · Le premier est le plus important

**Séparation entre celui qui prépare et celui qui autorise.**

Même si un compte cumulait les deux permissions — ce que la matrice interdit,
mais un administrateur pourrait le faire —, le contrôle en dur reste :

```ts
if (autorisation.demandeeParId === session.employeId) {
  throw new Erreur(
    "Vous avez préparé cette demande. Un autre responsable doit l'autoriser."
  );
}
```

C'est le principe des quatre yeux. Sans lui, ItaPay devient un robinet.

### 1.2 · Le huitième se contrôle au démarrage

```ts
// lib/paiements/wave/client.ts
const cle = process.env.WAVE_API_KEY ?? "";

if (process.env.NODE_ENV !== "production" && cle.includes("_prod_")) {
  throw new Error(
    "REFUS DE DÉMARRAGE — clé Wave de production en environnement de " +
    "développement. Les paiements de test partiraient réellement."
  );
}

if (process.env.NODE_ENV === "production" && cle.includes("_test_")) {
  throw new Error(
    "REFUS DE DÉMARRAGE — clé Wave de test en production. Aucun paiement " +
    "n'aboutirait."
  );
}
```

**Une exception au démarrage, pas un avertissement.** L'application ne doit
pas pouvoir tourner dans cette configuration.

---

## 2. La clé Wave

### 2.1 · Trois règles absolues

**Jamais de préfixe `NEXT_PUBLIC_`.** Une variable ainsi préfixée part dans
le navigateur.

**Jamais dans un composant client.** Ni importée, ni passée en propriété, ni
renvoyée par une action.

**Jamais dans une réponse.** Aucune Server Action ne renvoie la clé, même
partiellement, même masquée.

### 2.2 · Contrôle après build

```bash
grep -r "wave_ci_\|WAVE_API_KEY" .next/static/ 2>/dev/null \
  && echo "⛔ CLÉ EXPOSÉE — ne pas déployer" \
  || echo "✅ clé absente du bundle client"
```

À ajouter à `verify-all.ts`, comme le contrôle sur
`SUPABASE_SERVICE_ROLE_KEY`.

### 2.3 · Signature des requêtes — à activer dès la création

Wave permet de signer chaque appel en HMAC-SHA256, avec un secret distinct de
la clé. Une clé volée seule devient alors inutilisable.

> ⚠️ **L'option ne s'active qu'à la création de la clé.** Elle ne peut pas
> être ajoutée ensuite — il faudrait révoquer et recréer.

À activer sur la clé de test comme sur celle de production. Le code doit
signer dans les deux cas, sinon le passage en production révélerait un
défaut.

### 2.4 · En développement, la clé ne vaut rien

Le portefeuille de test n'a pas d'argent réel. Une fuite se règle par une
révocation.

**Cela ne dispense d'aucune règle** : le code doit se comporter en
développement comme en production, sinon les défauts n'apparaissent qu'au
moment le plus coûteux.

---

## 3. L'idempotence — le garde-fou contre le double paiement

### 3.1 · La clé se génère à la création, jamais à l'appel

```prisma
model LignePaiement {
  /// Générée À LA CRÉATION de la ligne. Réutilisée à chaque tentative.
  /// NE JAMAIS générer au moment de l'appel Wave.
  cleIdempotence String @unique @default(uuid())
}
```

**Motif.** Wave garantit qu'une même clé n'enverra jamais l'argent deux fois.
Mais **deux clés différentes avec un corps identique produisent deux
transferts** — Wave l'écrit explicitement.

Générer la clé au moment de l'appel signifie : une nouvelle clé à chaque
tentative, donc un transfert par tentative.

### 3.2 · Contrôle automatisé

```bash
# La clé ne doit jamais être générée dans le code d'appel
grep -rn "randomUUID\|uuidv4\|crypto.randomUUID" lib/paiements/ \
  | grep -v "schema.prisma"
```

Ne doit rien renvoyer. Si un UUID est généré dans `lib/paiements/`, c'est
probablement une clé d'idempotence mal placée.

---

## 4. Le traitement des erreurs

### 4.1 · Une erreur système n'est pas un échec

C'est la règle la plus contre-intuitive de l'API, et la plus coûteuse si on
se trompe.

| Réponse | Statut à écrire | Motif |
| --- | --- | --- |
| `5xx`, `408`, `429` | **`EN_ATTENTE`** | L'état du transfert est **inconnu** |
| Coupure réseau, délai dépassé | **`EN_ATTENTE`** | Idem |
| `insufficient-funds` | `ECHOUE` | Définitif |
| `recipient-limit-exceeded` | `ECHOUE` | Définitif |
| `recipient-account-blocked` | `ECHOUE` | Définitif |
| `request-validation-error` | `ECHOUE` | Définitif |
| **Tout code inconnu** | **`EN_ATTENTE`** | **En cas de doute, jamais `ECHOUE`** |

> **Wave prévient** : marquer un paiement comme échoué alors qu'il est en
> cours conduit à le rejouer — et à envoyer l'argent deux fois.

### 4.2 · Chercher avant de rejouer

**Jamais de rejeu sans recherche préalable.**

```ts
async function reprendreEnAttente(ligne: LignePaiement) {
  // 1. Le paiement a-t-il abouti malgré l'erreur ?
  const trouve = await wave.rechercher({ client_reference: ligne.referenceIta });

  if (trouve.result.length > 0) {
    return majDepuisWave(ligne, trouve.result[0]);   // ne rien envoyer
  }

  // 2. Absent chez Wave → il n'est jamais arrivé, rejeu avec LA MÊME clé
  return executerLigne(ligne);
}
```

L'idempotence de Wave protège déjà. **On ne s'appuie pas sur une seule
protection quand il s'agit d'argent.**

### 4.3 · Reprise à délais croissants

```
+1 min · +5 min · +15 min · +1 h · +6 h
puis → anomalie critique, plus de reprise automatique
```

Au-delà de vingt-quatre heures, il faut appeler Wave. Insister ne sert plus.

---

## 5. La vérification du destinataire

### 5.1 · Obligatoire avant toute demande d'autorisation

`POST /v1/verify_recipient` pour **chaque ligne**.

| Réponse | Effet |
| --- | --- |
| `name_match: MATCH` | Poursuivre |
| `name_match: NO_MATCH` | **Bloquer la ligne** — le numéro appartient à un tiers |
| `name_match: NAME_NOT_KNOWN` | Avertir, ne pas bloquer |
| `within_limits: false` | **Bloquer la ligne** — plafond atteint |

**C'est ce qui rattrape une faute de frappe dans un numéro** — le risque
signalé depuis M2 sur le champ `numeroMobileMoney`.

### 5.2 · Une ligne bloquée n'annule pas les autres

Le montant autorisé **exclut** les lignes bloquées. Le DG voit le montant
réel, non le montant théorique.

Les lignes bloquées se corrigent et se rejouent dans une seconde demande.

### 5.3 · Ne pas vérifier en boucle

Wave limite à trente vérifications par numéro sur cinq minutes, puis bloque
le numéro pendant une heure.

La vérification a lieu **une fois par demande**, pas à chaque affichage
d'écran.

---

## 6. La fenêtre d'exécution

### 6.1 · Trois contrôles indépendants

```ts
// 1. L'autorisation n'a pas expiré
if (new Date() > autorisation.expireLe) throw new Erreur("Autorisation expirée");

// 2. Le montant n'a pas changé
if (montantActuel !== autorisation.montantFige) {
  throw new Erreur("Le montant a changé depuis l'autorisation. Redemandez-la.");
}

// 3. Le créneau est ouvert
if (!creneauOuvert(new Date())) {
  throw new Erreur("Hors créneau — 8 h à 14 h, du lundi au vendredi.");
}
```

**Les trois sont vérifiés à l'exécution**, pas seulement à l'affichage. Un
écran ouvert depuis trois heures ne doit pas pouvoir déclencher un paiement.

### 6.2 · L'autorisation ne dépasse jamais 14 h

```ts
const expire = new Date(Math.min(
  maintenant.getTime() + dureeAutorisation * 60000,
  aujourdhuiA(14, 0).getTime(),
));
```

Une autorisation donnée à 13 h 30 expire à 14 h, non à 15 h 30.

### 6.3 · Trois échecs bloquent

```ts
if (autorisation.nombreEchecs >= 3) {
  throw new Erreur(
    "Trois tentatives ont échoué. Le Directeur Général doit reconfirmer."
  );
}
```

Trois échecs consécutifs signalent autre chose qu'un incident réseau.

---

## 7. Traçabilité

### 7.1 · Ce qui est journalisé

| Événement | Contenu |
| --- | --- |
| Demande d'autorisation | Auteur, montant, nombre de lignes, source |
| Autorisation | Auteur, horodatage, montant figé, expiration |
| Refus | Auteur, motif |
| Exécution | Auteur, montant, nombre de lignes |
| Chaque tentative | Numéro, code HTTP, code d'erreur, réponse brute |
| Annulation | Auteur, motif, identifiant Wave |

### 7.2 · Ce qui n'y figure jamais

**Aucun numéro de téléphone complet au journal d'audit.** Un identifiant de
ligne, pas le numéro du bénéficiaire.

Le numéro figure sur le **relevé de paiement** — pièce comptable, accès
restreint — jamais au journal, qui est plus largement consultable.

### 7.3 · La réponse brute de Wave est conservée

```prisma
model TentativePaiement {
  reponseBrute Json   /// Réponse Wave complète, telle que reçue
}
```

En cas de litige avec Wave ou avec un bénéficiaire, c'est la seule preuve de
ce qui a été demandé et de ce qui a été répondu.

---

## 8. Les tests, et où ils tournent

### 8.1 · Jamais contre la production

```ts
// En tête de chaque script de test
if (!process.env.WAVE_API_KEY?.includes("_test_")) {
  console.error("⛔ Ce script exige une clé de TEST. Refus d'exécution.");
  process.exit(1);
}
```

### 8.2 · Le test qui compte

`scripts/test-idempotence.ts`

| # | Étape | Attendu |
| --- | --- | --- |
| 1 | Créer un paiement, noter sa clé | Un transfert |
| 2 | Rejouer avec **la même clé** | **Toujours un seul transfert** |
| 3 | Simuler une réponse `503` | Statut `EN_ATTENTE`, jamais `ECHOUE` |
| 4 | Lancer `reprendreEnAttente` | Il **cherche** avant d'envoyer |
| 5 | Compter les transferts chez Wave | **Toujours un seul** |

Le point 5 est le seul qui compte vraiment.

### 8.3 · Vu échouer au moins une fois

Casse volontairement l'idempotence — génère une clé à l'appel — et vérifie
que le test détecte deux transferts. Puis remets.

Règle 7 de `CLAUDE.md`. Un test qu'on n'a jamais vu échouer n'est pas un
test.

---

## 9. Contrôle avant mise en exploitation

Aucun paiement réel avant que ces douze points soient vérifiés.

- [ ] La clé Wave n'apparaît dans aucun fichier du bundle client
- [ ] La signature HMAC est activée et vérifiée
- [ ] Le démarrage est refusé avec une clé de production en développement
- [ ] Les huit interdits de la section 1 sont vérifiés côté serveur
- [ ] La clé d'idempotence est générée à la création, jamais à l'appel
- [ ] Une réponse `5xx` écrit `EN_ATTENTE`, jamais `ECHOUE`
- [ ] `reprendreEnAttente` cherche avant de rejouer
- [ ] `verify_recipient` est appelé pour chaque ligne
- [ ] Un `NO_MATCH` bloque la ligne
- [ ] L'autorisation ne dépasse jamais 14 h
- [ ] Aucun numéro de téléphone complet au journal
- [ ] `test-idempotence.ts` passe, et a été vu échouer une fois

---

## 10. Développement sur les offres gratuites

### 10.1 · Ce qui fonctionne

| Élément | Plan gratuit |
| --- | --- |
| Clé Wave de test dans `.env.dev` | ✅ Déjà couvert par `.gitignore` |
| Variables d'environnement Vercel | ✅ Chiffrées au repos |
| Edge Functions Supabase | ✅ Avec quota mensuel |
| `pg_cron` Supabase | ✅ Sans limite de fréquence |

### 10.2 · Deux limites à connaître

**Les tâches planifiées Vercel ne tournent qu'une fois par jour** sur le plan
Hobby. Or M15 a besoin d'une reprise horaire pour les paiements en état
inconnu.

Contournement : `pg_cron` chez Supabase, ou une reprise déclenchée au
chargement de l'écran d'exécution.

**Le plan Hobby interdit l'usage commercial.** Toléré en développement,
impossible en exploitation. C'est la décision G-08, toujours ouverte.

### 10.3 · La règle qui rend le passage indolore

**Le code se comporte en développement exactement comme en production.**

Même signature, même idempotence, même traitement d'erreurs, mêmes
gardes-fous. Seule la clé change, et l'endroit d'où part l'appel.

Un code qui « simplifie » en développement révèle ses défauts au pire moment.
