# M7 — Paie chantier

**Statut** : à ouvrir · **Prérequis** : M4, M6 · **Bloque** : rien
**Version cible** : `v0.8.0`

> Le module qui produit de l'argent qui sort. Une erreur ici se voit au
> premier virement, et se répare mal.
>
> Trois niveaux de validation, chacun contrôlant autre chose.

---

## 1. Décisions bloquantes

### 1.1 · Taux journalier d'un permanent — **à trancher** (G-06)

Un permanent affecté à un chantier est pointé au jour. Comment convertir son
salaire mensuel en taux journalier ?

| Option | Formule | Remarque |
| --- | --- | --- |
| **÷ 26** | Jours ouvrables moyens | Usage courant en Côte d'Ivoire |
| ÷ 30 | Jours calendaires | Taux plus bas |
| ÷ 22 | Jours ouvrés stricts | Taux plus élevé |

**Recommandation : ÷ 26**, en paramètre `paie.diviseurTauxJournalier`.

**À vérifier contre la convention collective du BTP.**

### 1.2 · Heures supplémentaires — **à trancher**

Existent-elles sur chantier ? Si oui :

- À partir de combien d'heures par jour ou par semaine ?
- Quelle majoration — 15 %, 25 %, 50 % selon le rang de l'heure ?
- Un plafond hebdomadaire ?
- Majoration spécifique pour le travail de nuit, du dimanche, des jours fériés ?

Le Code du travail ivoirien encadre ces taux. **Valeurs à obtenir.**

### 1.3 · Retenues — **à trancher**

Le module gère-t-il les avances sur salaire, les acomptes, les retenues pour
absence non justifiée ?

**Recommandation** : oui pour les avances et acomptes — ils sont fréquents en
BTP. Non pour les cotisations et impôts, qui relèvent de la comptabilité.

### 1.4 · Format des exports — **à fournir**

| Destination | Format attendu |
| --- | --- |
| Banque — permanents | Fichier de virement de masse. Format de la banque à obtenir. |
| Wave — journaliers | Format d'import à obtenir auprès de Wave. |
| Comptabilité | Tableur, ou format d'import du logiciel comptable. |

Sans ces formats, l'export sera un tableur générique à retraiter à la main.

### 1.5 · Validation partielle — **à trancher**

Une période peut-elle être validée agent par agent, ou est-ce tout ou rien ?

**Recommandation : tout ou rien.** Une validation partielle multiplie les
états et rend le contrôle illisible. Un agent litigieux se sort de la
période, on paie les autres, on traite son cas à part.

---

## 2. Objectif

Transformer les relevés d'activité visés en montants à payer, avec un circuit
de validation à trois niveaux et des exports exploitables.

**Critère de réussite** : la Direction RH ouvre une période, le calcul se
fait seul depuis les relevés, trois validations s'enchaînent, et le fichier
de virement part sans retouche.

---

## 3. Circuit

```
1. Ouverture de période      RH — choisit le chantier et les dates
2. Calcul automatique        depuis les relevés VISÉS uniquement
3. Contrôle RH               vérifie les pointages, corrige les anomalies
4. Validation DT             conformité technique — les heures correspondent au chantier
5. Validation DFC            engagement financier — le montant est autorisé
6. Export                    fichier bancaire et fichier Wave
7. Clôture                   la période devient immuable
```

Chaque étape est **horodatée et tracée**. Une période validée ne se rouvre
pas sans annulation explicite, journalisée.

### Ce que chaque validateur contrôle

| Validateur | Regarde |
| --- | --- |
| **RH** | Les jours pointés correspondent-ils aux relevés ? Les absences sont-elles justifiées ? |
| **Directeur Technique** | Les heures déclarées correspondent-elles à l'avancement du chantier ? |
| **Directeur Financier** | Le montant total est-il conforme au budget ? Les dérogations sont-elles réglées ? |

Trois questions différentes. C'est ce qui justifie trois étapes.

---

## 4. Écrans

| Écran | Route | Permission | Patron |
| --- | --- | --- | --- |
| Périodes de paie | `/paie/periodes` | `paie:ouvrirPeriode` | 3 |
| Détail de période | `/paie/periodes/[id]` | selon l'étape | **8 — circuit** |
| Ouvrir une période | modale | `paie:ouvrirPeriode` | 4 |
| Exports | `/paie/exports` | `paie:exporter` | 3 |

### 4.1 · Détail de période — l'écran central

Patron 8. Trois zones :

**En-tête** — chantier, dates, état du circuit avec les trois validateurs et
leur décision, montant total.

**Corps** — une ligne par agent : jours pointés, taux, montant brut,
retenues, net. Les anomalies ressortent.

**Pied** — la décision à prendre, selon le rôle et l'étape.

Référence de forme : `reference/patrons/periode-paie-detail.tsx`.

### 4.2 · Anomalies à signaler dans la liste

| Anomalie | Signal |
| --- | --- |
| Agent avec zéro jour pointé | Ambre — pourquoi est-il dans la période ? |
| Agent en dérogation non validée | Rouge — **exclu de l'export** |
| Écart de plus de 20 % avec la période précédente | Ambre |
| Agent absent non justifié plus de 3 jours | Ambre |

---

## 5. Modèle de données

`PeriodePaie` · `LignePaie` · `EvenementPeriodePaie` · `ExportPaie`

### 5.1 · Les événements portent l'historique

`EvenementPeriodePaie` enregistre chaque transition, avec auteur, horodatage
et commentaire. Le statut courant se **déduit** du dernier événement.

Ne jamais stocker le statut seul : on perdrait qui a validé quoi et quand.

### 5.2 · Une ligne de paie fige tout

```prisma
model LignePaie {
  employeId          String
  /// Copies figées au calcul — l'employé peut changer de poste ensuite
  nomEmploye         String
  posteLibelle       String
  tauxJournalier     Decimal
  joursPointes       Decimal
  heuresSupp         Decimal
  montantBrut        Decimal
  retenues           Decimal
  montantNet         Decimal
  moyenPaiement      String   /// VIREMENT ou WAVE
  compteDestination  String   /// RIB ou numéro Wave, figé
}
```

**Tout est figé au calcul.** Si l'employé change de numéro Wave en septembre,
la paie d'août reste justifiable avec le numéro d'août.

---

## 6. Permissions

| Permission | Portée | Rôles |
| --- | --- | --- |
| `paie:ouvrirPeriode` | Ouvrir, calculer, contrôler | ADMIN, DRH, RH |
| `paie:validerDT` | Validation technique | ADMIN, DT |
| `paie:validerDFC` | Validation financière | ADMIN, DFC |
| `paie:exporter` | Générer les fichiers | ADMIN, DFC |

**Auto-approbation interdite en dur** — décision B-05. Si le Directeur
Technique a lui-même ouvert la période, il ne peut pas la valider à l'étape DT.

---

## 7. Server Actions

| Action | Permission |
| --- | --- |
| `ouvrirPeriode` | `paie:ouvrirPeriode` |
| `calculerPeriode` | `paie:ouvrirPeriode` |
| `corrigerLigne` | `paie:ouvrirPeriode`, période en contrôle RH |
| `validerRH` | `paie:ouvrirPeriode` |
| `validerDT` | `paie:validerDT` + non-auteur |
| `validerDFC` | `paie:validerDFC` + non-auteur |
| `refuserPeriode` | selon l'étape, motif obligatoire |
| `genererExport` | `paie:exporter`, période validée |
| `cloturerPeriode` | `paie:exporter`, après export |
| `annulerPeriode` | ADMIN seul, journalisé |

### `calculerPeriode` — ce qu'il fait exactement

1. Charge tous les relevés **visés** du chantier sur la période
2. Agrège les pointages par agent
3. Calcule le taux : journalier depuis son contrat, permanent par division
4. Applique les heures supplémentaires selon les paramètres
5. Applique les retenues et avances
6. **Exclut les agents en dérogation salariale non validée**
7. Signale les anomalies

Un relevé non visé **n'entre pas** dans le calcul. Il apparaît dans une liste
d'exclusions, avec sa raison.

---

## 8. Règles métier

### 8.1 · Seuls les relevés visés entrent

Un relevé en brouillon ou soumis mais non visé ne produit aucun paiement. Il
est listé à part, pour que personne ne découvre l'oubli après le virement.

### 8.2 · Une dérogation non validée exclut

L'agent apparaît dans la période, en rouge, avec zéro dans l'export. C'est le
verrou posé en M2 et M4.

### 8.3 · Le paiement porte sur les jours pointés

Jamais sur les jours prévus, jamais sur les jours d'affectation. Le pointage
visé fait foi.

### 8.4 · Une période clôturée est immuable

Aucune modification. Une erreur découverte après clôture se corrige par une
**régularisation sur la période suivante**, avec motif.

### 8.5 · Pas de chevauchement de périodes

Deux périodes ne peuvent pas se recouvrir sur le même chantier. Contrainte à
l'ouverture, sinon des jours seraient payés deux fois.

### 8.6 · Auto-approbation interdite

Décision B-05. Le contrôle est en dur, pas configurable.

### 8.7 · L'export est tracé

Chaque génération enregistre qui, quand, quel format, quel montant total, et
un condensat du fichier. Un fichier régénéré doit produire le même condensat.

---

## 9. Critères de recette

### Ouverture et calcul

- [ ] Ouvrir une période sur un chantier
- [ ] **Deux périodes chevauchantes sur le même chantier sont refusées**
- [ ] Le calcul agrège les relevés visés uniquement
- [ ] Un relevé non visé apparaît dans la liste des exclusions
- [ ] Le taux journalier d'un permanent applique le diviseur paramétré
- [ ] Un journalier utilise le taux de son contrat

### Anomalies

- [ ] Un agent avec zéro jour pointé est signalé
- [ ] **Un agent en dérogation non validée apparaît en rouge avec zéro à l'export**
- [ ] Un écart de plus de 20 % avec la période précédente est signalé
- [ ] Les signaux sont lisibles **par libellé**, pas seulement par couleur

### Circuit

- [ ] Les trois validations s'enchaînent dans l'ordre
- [ ] Chaque étape enregistre auteur et horodatage
- [ ] **L'auteur de l'ouverture ne peut pas valider à l'étape DT**
- [ ] Un refus exige un motif et renvoie à l'étape précédente
- [ ] **`validerDFC` appelée sans la permission, par requête POST directe, est refusée**
- [ ] Le statut se déduit des événements, il n'est pas stocké seul

### Immutabilité

- [ ] Une ligne de paie fige nom, poste, taux et compte de destination
- [ ] Changer le numéro Wave après clôture ne modifie pas la période close
- [ ] **Une période clôturée n'est plus modifiable**
- [ ] Annuler une période close exige le rôle ADMIN et est journalisé

### Export

- [ ] Le fichier de virement contient les permanents
- [ ] Le fichier Wave contient les journaliers
- [ ] Les agents exclus n'y figurent pas
- [ ] Le total du fichier correspond au total affiché
- [ ] Régénérer produit le même condensat
- [ ] La génération est tracée au journal

### Build

- [ ] `npx tsc --noEmit` et `npm run build` passent
- [ ] `scripts/verify-m7.ts` couvre au moins : un journalier, un permanent, un agent en dérogation, un relevé non visé

---

## 10. Points de vigilance

1. **Seuls les relevés visés entrent.** Les autres sont listés, jamais oubliés silencieusement.
2. **Une dérogation non validée exclut de l'export.** C'est le verrou de M2 et M4 qui se ferme ici.
3. **Tout est figé sur la ligne de paie.** Une paie doit rester justifiable un an plus tard.
4. **Auto-approbation interdite en dur.**
5. **Pas de chevauchement de périodes.** Sinon double paiement.
6. **Une période close se corrige par régularisation**, jamais par modification.
7. **Rien de sensible au journal** — des identifiants et des montants totaux, jamais de RIB ni de numéro Wave.

### Ce qui ne se décide pas seul

Les cinq décisions de la section 1, la formule de calcul, les règles
d'exclusion, le format des exports.
