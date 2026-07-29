# M1 — Organisation

**Statut** : annoncé livré · **Prérequis** : M0 · **Bloque** : M2
**Version cible** : `v0.2.0` · **Rédigé le** : 29 juillet 2026

> ⚠️ **Ce dossier est rédigé après la livraison.** Il sert donc de **grille
> de vérification** plutôt que de spécification : M1 a été construit sans
> périmètre écrit, à partir de `DECISIONS.md` section A seule.
>
> Déroule la section 8 pour savoir si ce qui a été livré correspond à ce qui
> était décidé. Tout écart constaté doit être corrigé avant d'ouvrir M2 —
> M2 s'appuie entièrement sur ce référentiel.

---

## 1. Objectif

Rendre l'organigramme d'ITA manipulable dans l'application : quatre
directions, huit services, trente postes, avec leur chaîne hiérarchique.

**Critère de réussite** : un utilisateur habilité peut créer un service, y
rattacher un poste, et voir la structure complète dans l'organigramme. Le
référentiel est prêt à recevoir des employés.

---

## 2. Périmètre

### Dans le périmètre

- Référentiel des directions — lecture, création, modification, archivage
- Référentiel des services, rattachés à une direction
- Référentiel des postes, rattachés à un service **ou directement à une direction**
- Organigramme visuel, dépliable
- Contrôle de cohérence de la chaîne hiérarchique
- Seed conforme à `DECISIONS.md` section A

### Hors périmètre

Les employés, les affectations, les contrats. M1 crée les **cases**, pas
leurs occupants.

---

## 3. Écrans

| Écran | Route | Permission |
| --- | --- | --- |
| Organigramme | `/organisation/organigramme` | `employe:lire` |
| Directions | `/organisation/directions` | `employe:lire` |
| Services | `/organisation/services` | `employe:lire` |
| Postes | `/organisation/postes` | `employe:lire` |
| Contrôle de cohérence | `/organisation/coherence` | `employe:lire` |

**Référence visuelle** : `reference/ApercuM1.jsx`.

### Organigramme

Une carte dépliable par direction. À l'intérieur : d'abord les postes
rattachés directement à la direction, puis un bloc par service.

Chaque poste affiche son niveau hiérarchique, son effectif, et un marqueur
« hors PDF » s'il ne figure pas à l'organigramme signé.

### Contrôle de cohérence

Quatre contrôles, exécutés en continu :

| Contrôle | Attendu |
| --- | --- |
| Postes sans supérieur | Un seul — le Directeur Général |
| Boucles hiérarchiques | Aucune |
| Postes sans titulaire | Signalés, non bloquants |
| Charge d'encadrement excessive | Signalée au-delà de 15 subordonnés |

---

## 4. Modèle de données

`Direction` · `Service` · `Poste`

### ⚠️ Un ajout requis — à valider avant M2

Le schéma actuel porte la hiérarchie sur `Affectation.superieurId`, donc
**par employé**. Mais `DECISIONS.md` section A décrit la chaîne au niveau
des **postes** — un mécanicien relève du Chef du Garage, quel que soit
l'occupant.

Il manque donc un lien par défaut sur le poste :

```prisma
model Poste {
  // …
  /// Supérieur par défaut, au niveau du poste. Sert à proposer
  /// automatiquement le bon supérieur lors d'une affectation.
  /// `Affectation.superieurId` reste le lien réel, personne par personne,
  /// et peut s'en écarter.
  superieurPosteId String?
  superieurPoste   Poste?  @relation("HierarchiePoste", fields: [superieurPosteId], references: [id])
  subordonnesPoste Poste[] @relation("HierarchiePoste")
}
```

**Pourquoi les deux.** Le poste porte la règle générale ; l'affectation
porte le cas réel. Un chef de chantier relève normalement du Directeur
Technique, mais on doit pouvoir désigner un autre supérieur pour un agent
donné sans modifier le référentiel.

Sans `superieurPosteId`, l'écran d'affectation de M2 ne pourra rien
proposer — l'utilisateur devra choisir le supérieur à la main pour chaque
employé, avec les erreurs que cela suppose.

**Si M1 a été livré sans ce champ**, c'est une migration à ajouter avant M2.

---

## 5. Permissions

| Permission | Portée |
| --- | --- |
| `employe:lire` | Consulter le référentiel et l'organigramme |
| `referentiel:creer` | Créer et modifier services et postes |
| `direction:creer` | Créer et modifier une direction — **Super Admin seul** |
| `posteDirection:affecter` | Affecter un poste marqué `reserveAdmin` — **Super Admin seul** |

**Aucune permission de suppression.** On archive, on ne supprime pas — voir
section 7.

---

## 6. Server Actions attendues

Toutes enveloppées dans `actionProtegee`.

| Action | Permission |
| --- | --- |
| `creerDirection` · `modifierDirection` · `archiverDirection` | `direction:creer` |
| `creerService` · `modifierService` · `archiverService` | `referentiel:creer` |
| `creerPoste` · `modifierPoste` · `archiverPoste` | `referentiel:creer` |

### Création inline — le point qui saute toujours

`creerService` et `creerPoste` sont appelées depuis un combobox créable.
Deux utilisateurs peuvent créer « Service Topographie » au même instant.

**Règle** : en cas de doublon sur le libellé normalisé, renvoyer
**l'entité existante** plutôt qu'une erreur. Le client la sélectionne comme
si elle venait d'être créée.

Sans cela, le référentiel se remplit de « Topographie », « topographie » et
« Service topographie ».

Voir `lib/actions/employe.ts`, fonction `creerService`, pour le patron.

---

## 7. Règles métier

### 7.1 · Un poste peut n'avoir aucun service

`Poste.serviceId` vaut `null` pour **quatorze postes**. Ce n'est pas un
défaut de saisie, c'est la structure.

| Direction | Postes sans service |
| --- | --- |
| DG | Directeur Général, Assistante de Direction |
| DFC | Directeur Financier et Comptable |
| DT | Directeur Technique, Conducteur de Travaux, Chef Chantier, Chef Chantier Adjoint, Chef d'équipe, Ouvrier, Manœuvre |
| DAR | Directeur Administratif et RH, Assistant RH, Coursier, Technicien de surface |

Motif : un directeur se situe au niveau de sa direction, ce qui en fait le
supérieur des chefs de service. Et la chaîne chantier intervient sur les
projets des cinq services techniques.

### 7.2 · Archiver, jamais supprimer

Un service ou un poste référencé par une affectation, même clôturée, ne peut
pas être supprimé — l'historique des contrats et des paies deviendrait
illisible.

`archiveLe` est renseigné. L'élément disparaît des sélecteurs mais reste
lisible dans l'historique.

### 7.3 · Poste à titulaire unique

`titulaireUnique = true` sur les quatre postes de direction. Une seconde
affectation active sur le même poste doit être refusée, avec le nom de
l'occupant dans le message.

### 7.4 · Postes réservés

`reserveAdmin = true` sur les postes de direction. Ils apparaissent dans les
sélecteurs mais **désactivés avec leur raison** — « Affectation réservée au
Super Admin » — plutôt que masqués. L'utilisateur comprend pourquoi il ne
peut pas les choisir.

### 7.5 · Unicité

`Direction.code`, `Service.code` et `Poste.code` sont uniques. Le code se
dérive du libellé : majuscules, sans accent, underscores.

`SERVICE_ADDUCTION_EAU_POTABLE` pour « Service Adduction d'Eau Potable ».

---

## 8. Grille de vérification

À dérouler maintenant, puisque M1 est annoncé livré.

### Seed — conformité à `DECISIONS.md` section A

- [ ] **4 directions** : DG, DFC, DT, DAR
- [ ] **8 services** : Achats · Comptabilité · Études et Appels d'Offres · Adduction d'Eau Potable · Assainissement · Routes et Voiries · Logistique · QHSE
- [ ] **Aucun service « Secrétariat de Direction »** — ce n'est pas un service
- [ ] **Aucun service « Administration & RH »** — invention retirée du registre
- [ ] **30 postes** exactement
- [ ] **Service Logistique rattaché à la Direction Technique**, non à la Financière

### Postes sans service

- [ ] 14 postes ont `serviceId = null`, conformément au tableau 7.1
- [ ] Le Coursier et le Technicien de surface ne sont **pas** rattachés au Service QHSE
- [ ] Chef Chantier, Chef Chantier Adjoint et Chef d'équipe ne sont rattachés à aucun service

### Intitulés

- [ ] « Chef de Service … » pour les cinq chefs de service
- [ ] **Deux exceptions conservées** : « Chef du Garage » et « Chargé d'études et travaux »
- [ ] « Directeur Administratif et RH » au masculin — le genre appartient à la personne, pas au poste

### Chaîne hiérarchique

- [ ] Le Directeur Général est le seul poste sans supérieur
- [ ] Mécanicien → Chef du Garage
- [ ] Gestionnaire de stocks → Chef de Service Logistique
- [ ] Chef du Garage → Chef de Service Logistique
- [ ] **Chef Chantier → Directeur Technique**, non le Conducteur de Travaux
- [ ] Chef d'équipe → Chef Chantier
- [ ] Ouvrier et Manœuvre → Chef d'équipe
- [ ] Relais QHSE → Assistant QHSE → Chef de Service QHSE
- [ ] Assistant comptable → Directeur Financier et Comptable, directement
- [ ] Aucune boucle détectée

### Permissions

- [ ] Créer une direction est refusé à tout rôle sauf `ADMIN`
- [ ] Créer un service et un poste fonctionne avec `referentiel:creer`
- [ ] Un rôle sans `employe:lire` ne voit pas les écrans d'organisation
- [ ] **Appel d'une Server Action de création par requête POST directe, hors permission → refusée**, et le refus apparaît au journal

### Interface

- [ ] Tous les sélecteurs sont des champs à autocomplétation — règle R-04
- [ ] Créer un service depuis le combobox fonctionne, sans quitter le formulaire
- [ ] Un doublon de libellé renvoie l'entité existante, pas une erreur
- [ ] Les postes réservés apparaissent désactivés **avec leur raison**, non masqués
- [ ] Aucun statut lisible à la seule couleur — règle R-01
- [ ] Les pastilles de niveau portent leur libellé en clair

### Modèle

- [ ] Le champ `superieurPosteId` existe sur `Poste` — voir section 4
- [ ] L'archivage fonctionne, la suppression physique est impossible
- [ ] `titulaireUnique` est vrai sur les quatre postes de direction

---

## 9. Points de vigilance

1. **M2 dépend entièrement de ce référentiel.** Une erreur de hiérarchie ici produira des demandes de congé mal routées en M3.
2. **Ne pas inventer de poste** pour combler un vide. Les cinq services sans encadrement au PDF sont volontairement laissés tels quels.
3. **Le PDF officiel est en écart** sur deux points : le rattachement du Service Logistique, et quatorze postes absents. C'est l'action H-02, à traiter hors application.
4. **`DECISIONS.md` fait foi.** En cas de divergence avec le code, c'est le code qui a tort.
