# Documentation Wave — à déposer ici

Ce dossier est **vide** et doit être rempli avant de lancer le module.

## Ce qu'il faut enregistrer

| Page | Adresse | Pourquoi |
| --- | --- | --- |
| **Payout API** | `https://docs.wave.com/payout` | **La page qui compte** — paiements sortants, idempotence, erreurs |
| Business API | `https://docs.wave.com/business#api-reference` | Référence générale |

En Markdown de préférence — plus léger qu'un PDF, et lisible par extraits.

## Pourquoi une copie locale

**L'API Wave est peu représentée dans les données d'entraînement des
modèles.** C'est une API africaine, sans grande présence dans les dépôts
publics ni les forums techniques.

Sans documentation sous la main, un assistant inventera des champs
plausibles — `amount` au lieu de `receive_amount`, `phone` au lieu de
`mobile`, un `status` qui n'existe pas.

Ces erreurs ne se voient qu'à l'exécution, et sur ce module elles coûtent de
l'argent.

## Les points déjà vérifiés

`M15-ITAPAY.md` § 3 contient ce qui a été extrait de la documentation le
**31 juillet 2026** : points d'entrée, en-têtes, formats, codes d'erreur,
états.

Si la documentation dit autre chose aujourd'hui, **c'est elle qui a raison** —
et l'écart doit être signalé.
