# M15 — ItaPay · Dossier complet

Tout ce qu'il faut pour construire le module d'exécution des paiements.

---

## Contenu

```
M15/
├─ LISEZ-MOI.md            ce fichier
├─ CLAUDE-M15.md           instructions permanentes, contextualisées
├─ DECISIONS-M15.md        les décisions applicables — fait foi
├─ SECURITE-M15.md         huit interdits en dur — obligatoire
├─ M15-ITAPAY.md           le dossier du module
└─ reference/
   ├─ ApercuItaPay.jsx     référence visuelle
   └─ wave/                documentation de l'API, à déposer
```

---

## Comment déposer

| Fichier | Destination dans le dépôt |
| --- | --- |
| `CLAUDE-M15.md` | racine, renommé **`CLAUDE.md`** |
| `DECISIONS-M15.md` | `docs/1-modules/` |
| `SECURITE-M15.md` | `docs/1-modules/` |
| `M15-ITAPAY.md` | `docs/1-modules/` |
| `reference/ApercuItaPay.jsx` | `reference/m15/` |
| `reference/wave/*` | `reference/m15/wave/` |

> Si un `CLAUDE.md` général existe déjà, ne l'écrase pas — donne
> `CLAUDE-M15.md` en tête de session.

**Le dossier `reference/wave/` est vide.** Enregistres-y les deux pages de
documentation Wave, en Markdown ou en PDF :

- `https://docs.wave.com/payout` — la page qui compte
- `https://docs.wave.com/business#api-reference`

Sans elles, Claude Code dépendra d'une recherche web à chaque question, et
risque d'inventer des champs plausibles.

---

## Deux choses à faire avant de lancer

### 1 · Créer la clé Wave de test

Sur `https://business.wave.com/dev-portal`.

> ⚠️ **Activer la signature des requêtes à la création.** L'option ne peut
> pas être ajoutée ensuite — il faudrait révoquer la clé et en créer une
> autre.

Puis ajouter à `.env.dev` :

```
WAVE_API_KEY=wave_ci_test_…
WAVE_SIGNING_SECRET=wave_ci_AKS_…
WAVE_BASE_URL=https://api.wave.com
```

### 2 · Écrire à Wave sur la liste blanche

> Bonjour,
>
> Nous intégrons l'API Payout pour une application déployée sur une
> infrastructure serverless, sans adresse IP fixe.
>
> Trois questions :
>
> 1. La liste blanche d'adresses IP est-elle obligatoire pour un compte
>    marchand en Côte d'Ivoire, ou reste-t-elle optionnelle ?
> 2. Si elle est obligatoire, acceptez-vous une plage CIDR correspondant
>    à une région cloud ?
> 3. La signature HMAC des requêtes est-elle jugée suffisante en
>    l'absence de liste blanche ?
>
> Cordialement,

**Leur réponse ne bloque pas le développement** — elle décide seulement du
déploiement en production.

---

## Le plan de livraison

### Livraison 1 — le circuit, sans exécution réelle

Un **client Wave simulé** rejoue les réponses — succès, `NO_MATCH`,
`insufficient-funds`, `503` — sans rien envoyer.

C'est ce qui permet de tester tous les cas d'erreur avant même d'avoir un
portefeuille, et de provoquer une erreur serveur à volonté — ce qu'un client
réel ne permet pas.

Six étapes, détaillées dans `M15-ITAPAY.md` § 13.

### Livraison 2 — exécution réelle sur le portefeuille de test

### Livraison 3 — lots, annulation, anomalies

---

## Le prompt de démarrage

```
On ouvre M15 — ItaPay. C'est le seul module du projet qui exécute des
paiements réels.

Lis, dans cet ordre :

  1. CLAUDE.md              instructions permanentes
  2. DECISIONS-M15.md       les décisions applicables — fait foi
  3. SECURITE-M15.md        huit interdits en dur — pas optionnel
  4. M15-ITAPAY.md          le dossier du module
  5. reference/m15/ApercuItaPay.jsx    référence visuelle, PAS du code à intégrer

L'API Wave est documentée dans reference/m15/wave/. NE T'APPUIE PAS SUR TA
M�MOIRE pour cette API — elle est peu représentée dans tes données
d'entraînement. Tout champ, tout endpoint, tout code d'erreur doit venir de
la documentation lue.

LIVRAISON 1 — le circuit, avec un CLIENT SIMULÉ

Pas d'appel réel. Un client qui rejoue les réponses de Wave :
succès · NO_MATCH · insufficient-funds · 503 · timeout

C'est ce qui permet de tester l'aiguillage des erreurs de façon
reproductible — notamment le cas le plus dangereux, le 503, qui doit écrire
EN_ATTENTE et jamais ECHOUE.

Six étapes, M15-ITAPAY.md § 13.

Propose-moi un plan découpé. Pour chaque étape : ce que tu produis, ce que je
vérifie, ce que tu ne décides pas seul.

Pas de code avant validation.
```

---

## Les cinq erreurs qui coûteraient de l'argent

Rappelées ici parce qu'elles sont les seules irréversibles.

**1 · Générer la clé d'idempotence au moment de l'appel.** Chaque tentative
devient un transfert.

**2 · Écrire `ECHOUE` sur une réponse `5xx`.** L'état est inconnu, pas
échoué. Le rejeu envoie l'argent une seconde fois.

**3 · Rejouer sans chercher d'abord.**

**4 · Sauter `verify_recipient`.** C'est le seul contrôle qui rattrape un
chiffre inversé dans un numéro.

**5 · Laisser une même personne préparer et autoriser.**
