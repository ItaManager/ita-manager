# DECISIONS-M19.md — Décisions applicables aux missions

> **Extrait de `DECISIONS.md`.** Ce fichier ne remplace pas le registre — il
> rassemble ce qui concerne les missions et frais de mission.
>
> **En cas de contradiction, `DECISIONS.md` fait foi.**

---

## Propres à M19

Sept décisions arrêtées. Détail dans `M19-MISSIONS.md` § 2.

| # | Décision |
| --- | --- |
| 2.1 | **Les frais sont AVANCÉS**, pas remboursés. La DFC verse avant le départ. |
| 2.2 | **Saisie libre, justificatifs obligatoires.** Pas de barème. Contrôle ligne à ligne. |
| 2.3 | **Le supérieur direct vise d'abord.** Aucune exception — B-01. |
| 2.4 | **Le rapport justifie les frais.** Pas de rapport, pas de régularisation, pas de nouvelle mission. |
| 2.5 | **Deux moyens de paiement** — Wave par M15, ou espèces sous plafond. |
| 2.6 | **Le statut se déduit**, il ne se stocke pas. Onze états. |
| 2.7 | **Une mission ne se supprime pas.** Elle s'annule, et plus du tout une fois l'avance versée. |

### Trois seuils restent à confirmer

| Seuil | Proposé | Qui tranche |
| --- | --- | --- |
| Plafond des espèces | 150 000 F | **Direction Financière** |
| Délai de dépôt du rapport | 7 jours ouvrables | Direction Financière |
| Restauration sans reçu | 5 000 F | Direction Financière |

Aucun ne bloque le développement — ce sont des paramètres.

---

## Héritées d'autres modules

### B-01 · Supérieur direct puis service compétent — **rappel transverse**

Toute demande passe par le N+1 direct, puis par le service compétent.

**Ce que M19 y ajoute** : le circuit compte **trois** réceptionnaires, pas
deux.

| Étape | Qui | Ce qu'il juge |
| --- | --- | --- |
| Visa | Supérieur direct | La mission a-t-elle lieu d'être ? Puis-je m'en passer ? |
| Validation | **Direction RH** | Les congés, les autres missions, l'historique |
| Versement | **Direction Financière** | Le montant et le moyen |

> **La RH décide sur ce que le supérieur ne voit pas.** C'est ce qui justifie
> deux étapes plutôt qu'une.

### B-02 · Un seul niveau hiérarchique — **rappel transverse**

Pas de cascade. Le supérieur direct suffit.

Un employé sans supérieur — le Directeur Général — passe directement à la RH.

### B-05 · Auto-approbation interdite en dur — **rappel transverse**

Personne ne valide sa propre demande.

**Ce que M19 y ajoute** : un membre de la Direction RH qui demande une
mission ne peut pas la valider lui-même. Son supérieur vise, puis un autre
membre de la RH — ou le DG — valide.

### B-06 · Relances par courriel selon l'urgence — **rappel transverse**

| Urgence | Délai |
| --- | --- |
| Critique | 24 h |
| Haute | 3 jours |
| Normale | 5 jours |

**Ce que M19 y ajoute** : une mission dont le départ approche à moins de cinq
jours devient **haute**. Un rapport non déposé au-delà du délai déclenche une
relance au demandeur **et à son supérieur**.

### B-07 · Le refus est définitif — **rappel de M3**

Un congé refusé ne se resoumet pas.

**Ce que M19 y ajoute** : le refus d'une mission enregistre **à quelle étape**
il a eu lieu — visa du N+1 ou validation RH. Le demandeur voit laquelle.

### A-12 · Trois niveaux de données — **rappel de M2**

Les **montants d'avance et de dépense** relèvent du niveau **sensible**.

Sur l'écran « Toutes les missions », ils sont masqués sans
`employe:donneesSensibles`, avec un cadenas.

**Un employé voit toujours les siens.**

### D-09 · Tâches planifiées — **rappel transverse**

Vercel Cron, route protégée par `CRON_SECRET`, exécution quotidienne.

**M19 y ajoute deux étapes** :

  — Relance des rapports non déposés au-delà du délai
  — Signalement des missions en anomalie au tableau de bord

### E-01 · Pagination — **rappel transverse**

Pagination **serveur**, 25 lignes, état dans l'URL.

L'écran « Toutes les missions » grossit d'environ deux cents lignes par an.

---

## Le lien avec M15 — ItaPay

**M19 ne paie rien lui-même.**

Un versement de moyen `WAVE` crée une `DemandePaiement` dans M15, de
catégorie `URGENT`. Elle suit alors le circuit complet :

```
M19 crée la demande
    ↓
M15 · le DG autorise avec son TOTP
    ↓
M15 · fenêtre de 8 h à 14 h, jours ouvrables
    ↓
M15 · la DFC exécute
    ↓
M19 · le versement est marqué effectué
```

**Les huit interdits de `SECURITE-M15.md` s'appliquent intégralement.** M19
ne les contourne pas.

### ⚠️ L'exception des espèces

Une remise en espèces **n'entre pas dans ce circuit**. Elle s'enregistre
directement dans M19, contre émargement.

C'est le seul endroit du projet où de l'argent sort sans double contrôle.
D'où le plafond, et d'où l'émargement obligatoire.

---

## Règles d'interface applicables

Toutes — `PATRONS.md`, `TYPOGRAPHIE.md`, `CHAMPS.md`.

Trois méritent une attention particulière.

**R-01 · Aucune information par la seule couleur.** Un reliquat porte « à
rendre », un complément porte « qui vous sera versé ».

**R-05 · Étapes pour créer.** La demande suit trois étapes, le rapport en
suit deux — patron 4 bis, `components/patterns/modale-etapes.tsx`.

**R-07 · Une option indisponible est verrouillée avec sa raison.** Le bouton
espèces au-delà du plafond reste visible, grisé, avec l'explication.

> Masquer l'option laisserait croire qu'elle n'existe pas. La verrouiller dit
> ce qui la débloquerait.

---

## Décisions en attente qui touchent M19

| # | Sujet | Effet |
| --- | --- | --- |
| **Nouvelle** | **La retenue sur salaire est-elle licite ?** | Un reliquat non rendu peut-il être retenu sur la paie ? À vérifier au regard du droit du travail ivoirien, et de l'accord écrit de l'employé. |
| G-08 | Offres payantes Vercel et Supabase | Le stockage des justificatifs |
| H-03 | Déclaration ARTCI | Les justificatifs peuvent contenir des données personnelles |

**Aucune ne bloque le développement.** La première bloque seulement le
troisième moyen d'apurement — espèces et Wave restent disponibles.
