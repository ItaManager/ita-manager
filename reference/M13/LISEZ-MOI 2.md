# M13 — Logistique et Parc · Dossier complet

Tout ce qu'il faut pour construire le module. **Sept décisions arrêtées,
aucune en attente.**

---

## Contenu

```
M13/
├─ LISEZ-MOI.md            ce fichier
├─ CLAUDE-M13.md           instructions permanentes, contextualisées
├─ DECISIONS-M13.md        les décisions applicables — fait foi
├─ M13-LOGISTIQUE.md       le dossier du module — 1 200 lignes
└─ reference/              formulaires et tableurs, à déposer
```

## Comment déposer

| Fichier | Destination |
| --- | --- |
| `CLAUDE-M13.md` | racine, renommé **`CLAUDE.md`** |
| `DECISIONS-M13.md` | `docs/1-modules/` |
| `M13-LOGISTIQUE.md` | `docs/1-modules/` |
| `reference/*` | `reference/M13/` |

> Si un `CLAUDE.md` général existe déjà, ne l'écrase pas — donne
> `CLAUDE-M13.md` en tête de session.

### Le dossier `reference/` est vide — à remplir

Dépose les documents d'origine :

| Fichier | Ce qu'il apporte |
| --- | --- |
| Les six formulaires PDF | `EN-GEL-04` · `08` · `15` · `16` · `17` |
| `ITA - CODE MATERIELS.xlsx` | Le parc réel, 21 feuilles |
| `Suivi Disponibilité Engins.xls` | Le calcul actuel de disponibilité |
| `INPUTS_VEHICULES_ENGINS.md` | Le catalogue de champs |

**Les formulaires sont la source la plus fiable.** Ils sont référencés au
système qualité, donc stables et appliqués.

---

## Le module en trois phrases

Sept types de matériel, dont six individuels et un par quantité.

Le Service Logistique tient déjà tout cela dans quatre tableurs et six
formulaires — **on transcrit un processus, on n'en invente pas un**.

Ce qui manque aujourd'hui : personne n'est prévenu qu'une assurance est
périmée depuis 273 jours.

---

## Livraison 1 — le registre et les échéances

C'est ce qui apporte le plus, immédiatement, et ce qui ne dépend de rien.

| # | Étape | Ce que je vérifie |
| --- | --- | --- |
| 1.1 | Modèle et migration | `npm run verify` passe |
| 1.2 | Référentiels — types de pièce, familles, lieux | Les 14 types sont chargés |
| 1.3 | Registre, trois niveaux de saisie | Créer un véhicule en 30 secondes |
| 1.4 | **Écran des échéances** | Une pièce périmée affiche ses 273 jours |
| 1.5 | **Écran des pièces administratives** | Les colonnes s'adaptent au filtre |
| 1.6 | Alertes par courriel, tâche quotidienne | Un courriel part à J−60 |
| 1.7 | Reprise des données — trois passes | La passe 1 n'écrit rien |

**Les livraisons 2 et 3** sont décrites en section 13 du dossier. Ne pas les
ouvrir avant que la 1 soit en service.

---

## Le prompt de démarrage

```
On ouvre M13 — Logistique et Parc, livraison 1.

Lis, dans cet ordre :

  1. CLAUDE.md                              instructions permanentes
  2. docs/1-modules/DECISIONS-M13.md        décisions applicables — fait foi
  3. docs/1-modules/M13-LOGISTIQUE.md       le dossier, 1 200 lignes
  4. reference/M13/                         formulaires et tableurs d'origine

CE MODULE TRANSCRIT UN PROCESSUS EXISTANT

Le Service Logistique tient déjà tout cela dans quatre tableurs et six
formulaires du système qualité — EN-GEL-04, 08, 15, 16, 17.

Quand un formulaire dit quelque chose, il fait foi. S'il te paraît étrange,
signale-le : il y a probablement une raison de terrain.

SEPT PIÈGES

  1. Deux natures de matériel — individuel et consommable, deux modèles
  2. L'état d'une pièce administrative se CALCULE, jamais stocké
  3. Le solde de stock se CALCULE
  4. Types de pièce et points d'inspection sont des RÉFÉRENTIELS, pas des enums
  5. Trois états d'inspection — BON, MAUVAIS, ABSENT — jamais un booléen
  6. Le lieu résulte des mouvements, jamais un champ modifiable
  7. M8 reste dans Technique — une seule table DemandeRessource, deux écrans

SEPT DÉCISIONS SONT ARRÊTÉES

Section 1 du dossier. Aucune n'est en attente. Ne les rouvre pas.

PÉRIMÈTRE — LIVRAISON 1 SEULEMENT

  1.1  modèle et migration
  1.2  référentiels — 14 types de pièce, familles, lieux
  1.3  registre, trois niveaux de saisie
  1.4  écran des échéances
  1.5  écran des pièces administratives
  1.6  alertes par courriel
  1.7  reprise des données, trois passes

Pas de stocks, pas d'inspections, pas de transport — livraisons 2 et 3.

AVANT DE PROPOSER LE PLAN

Vérifie que npm run verify passe au vert, et dis-moi ce que tu constates.

Puis propose un plan découpé. Pour chaque étape : ce que tu produis, ce que
je vérifie, ce que tu ne décides pas seul.

Pas de code avant validation.
```

---

## Le critère qui compte le plus

> Ouvrir l'écran des échéances et voir qu'une assurance est **périmée depuis
> 273 jours**.
>
> C'est ce que le tableur actuel affiche sans que personne soit prévenu.

---

## Ce qui suit

**M13 livraison 2** ferme le circuit d'achat : l'étape 6 de M14 — le contrôle
de conformité à la réception — est portée par ce module.

Tant qu'elle n'existe pas, M14 s'arrête au bon de commande et la facturation
reste manuelle.
