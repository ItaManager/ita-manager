# Registre des décisions — ITA Manager

> Source de vérité unique. En cas de divergence entre ce document et une
> autre spécification, **ce document l'emporte**.
>
> Toute décision porte un identifiant stable. Une décision révisée n'est
> pas réécrite : elle est marquée `Révisée` et une nouvelle entrée est
> ajoutée, pour que l'historique reste lisible.

Dernière mise à jour : 27 juillet 2026.

---

## A — Référentiel organisationnel

### A-01 · Source de l'organigramme — **Arrêtée**

Le document `ORGANIGRAMME_ITA_SARL — Version 02, juillet 2025`, signé du
Directeur Général, fait foi.

Les fichiers `VERSION_3.pdf` et `VERSION_4.pdf` fournis se sont révélés
identiques en contenu. Il n'existe donc **pas** de conflit de sources ;
l'écart signalé antérieurement provenait de postes extrapolés dans un
document de travail, non de l'organigramme.

### A-02 · Rattachement du Service Logistique — **Arrêtée, en écart avec le PDF**

Le Service Logistique relève de la **Direction Technique**.

⚠️ Le PDF le place sous la Direction Financière et Comptable. La décision
métier prime, mais **l'organigramme officiel doit être corrigé et signé à
nouveau** : un document de référence en écart avec la réalité finira par
produire d'autres contradictions.

### A-03 · Structure retenue — **Arrêtée**

**4 directions · 8 services**

Le Secrétariat de Direction n'est pas un service : l'Assistante de Direction
relève directement de la Direction Générale.

```
Direction Générale (DG)
├── Directeur Général                     ← poste, sans service
└── Assistante de Direction               ← poste, sans service

Direction Financière et Comptable (DFC)
├── Directeur Financier et Comptable      ← poste, sans service
├── Service Achats
└── Comptabilité

Direction Technique (DT)
├── Directeur Technique                   ← poste, sans service
├── Service Études et Appels d'Offres
├── Service Adduction d'Eau Potable
├── Service Assainissement
├── Service Routes et Voiries
├── Service Logistique                    ← A-02
└── Chaîne chantier                       ← postes, sans service

Direction Administrative et RH (DAR)
├── Directeur Administratif et RH         ← poste, sans service
├── Assistant RH                          ← poste, sans service
├── Service QHSE
└── Coursier · Technicien de surface      ← postes, sans service
```

**Les huit services** : Achats · Comptabilité · Études et Appels d'Offres ·
Adduction d'Eau Potable · Assainissement · Routes et Voiries · Logistique · QHSE

**Un directeur n'appartient à aucun service.** Il se situe au niveau de sa
direction. C'est ce qui en fait le supérieur hiérarchique des responsables
de service, et non leur pair — point déterminant pour les circuits
d'approbation de la section B.

`Poste.serviceId` vaut `null` pour tout poste rattaché directement à une
direction.

| Direction | Postes sans service |
| --- | --- |
| DG | Directeur Général, Assistante de Direction |
| DFC | Directeur Financier et Comptable |
| DT | Directeur Technique, Conducteur de Travaux, Chef Chantier, Chef Chantier Adjoint, Chef d'équipe, Ouvrier, Manœuvre |
| DAR | Directeur Administratif et RH, Assistant RH, Coursier, Technicien de surface |

### A-04 · Postes ajoutés hors organigramme

Le PDF nomme des **directions** et des **services**, mais peu de **postes**.
Quatorze postes ont donc été créés. **Tous sont confirmés existants.**

| Poste | Rattachement | Statut |
| --- | --- | --- |
| Directeur Général | DG, sans service | ✅ Confirmé pourvu |
| Directeur Financier et Comptable | DFC, sans service | ✅ Confirmé pourvu |
| Directeur Technique | DT, sans service | ✅ Confirmé pourvu |
| Directeur Administratif et RH | DAR, sans service | ✅ Confirmé pourvu |
| Assistant RH | DAR, sans service | ✅ Confirmé — traite les dossiers du personnel |
| Chef de Service Logistique | DT, Service Logistique | ✅ Confirmé |
| Chef de Service Achats | DFC, Service Achats | ✅ Confirmé |
| Assistant comptable | DFC, Comptabilité | ✅ Confirmé |
| Chef de Service QHSE | DAR, Service QHSE | ✅ Confirmé |
| Chef de Service Adduction d'Eau Potable | DT, Service AEP | ✅ Confirmé |
| Chef de Service Assainissement | DT, Service Assainissement | ✅ Confirmé |
| Chef de Service Routes et Voiries | DT, Service Routes et Voiries | ✅ Confirmé |
| Ouvrier | DT, sans service | ✅ Confirmé — voir A-11 |
| Manœuvre | DT, sans service | ✅ Confirmé — voir A-11 |

**Aucun service n'est ajouté.** Les huit services font foi.

> Le PDF signé omet donc quatorze postes confirmés. Voir A-02 — l'organigramme
> officiel devrait être corrigé et signé à nouveau.

**Ouvrier et Manœuvre** sont confirmés comme postes. Mais leur traitement
relève d'une décision distincte et structurante : voir **A-11**, sur les
deux origines de la main-d'œuvre de chantier.

### A-05 · Postes retenus — **Arrêtée**

| Direction | Service | Poste | Niveau | Source |
| --- | --- | --- | --- | --- |
| DG | *sans service* | Directeur Général | Direction | Ajouté ✅ |
| DG | *sans service* | Assistante de Direction | Support | PDF |
| DFC | *sans service* | Directeur Financier et Comptable | Direction | Ajouté ✅ |
| DFC | Service Achats | Chef de Service Achats | Cadre | Ajouté ✅ |
| DFC | Comptabilité | Assistant comptable | Support | Ajouté ✅ |
| DT | *sans service* | Directeur Technique | Direction | Ajouté ✅ |
| DT | Études et Appels d'Offres | Chargé d'études et travaux | Cadre | PDF |
| DT | Adduction d'Eau Potable | Chef de Service Adduction d'Eau Potable | Cadre | Ajouté ✅ |
| DT | Assainissement | Chef de Service Assainissement | Cadre | Ajouté ✅ |
| DT | Routes et Voiries | Chef de Service Routes et Voiries | Cadre | Ajouté ✅ |
| DT | *sans service* | Conducteur de Travaux | Cadre | PDF |
| DT | *sans service* | Chef Chantier | Cadre | PDF |
| DT | *sans service* | Chef Chantier Adjoint | Cadre | PDF |
| DT | *sans service* | Chef d'équipe | Opérationnel | PDF |
| DT | *sans service* | Ouvrier | Opérationnel | Ajouté ✅ |
| DT | *sans service* | Manœuvre | Opérationnel | Ajouté ✅ |
| DT | Logistique | Chef de Service Logistique | Cadre | Ajouté ✅ |
| DT | Logistique | Chef du Garage | Cadre | PDF |
| DT | Logistique | Gestionnaire de stocks | Opérationnel | PDF |
| DT | Logistique | Mécanicien | Opérationnel | PDF |
| DT | Logistique | Conducteur d'engins | Opérationnel | PDF |
| DT | Logistique | Gardien | Opérationnel | PDF |
| DT | Logistique | Chauffeur | Opérationnel | PDF |
| DAR | *sans service* | Directeur Administratif et RH | Direction | Ajouté ✅ |
| DAR | *sans service* | Assistant RH | Support | Ajouté ✅ |
| DAR | *sans service* | Coursier | Support | PDF |
| DAR | *sans service* | Technicien de surface | Opérationnel | PDF |
| DAR | QHSE | Chef de Service QHSE | Cadre | Ajouté ✅ |
| DAR | QHSE | Assistant QHSE | Support | PDF |
| DAR | QHSE | Relais QHSE | Opérationnel | PDF |

**30 postes** — 16 du PDF, 14 ajoutés, tous confirmés.

### A-06 · Composition du Service Logistique — **Arrêtée**

| Poste | Niveau | Source |
| --- | --- | --- |
| Chef de Service Logistique | Cadre | Ajouté ✅ |
| Chef du Garage | Cadre | PDF |
| Gestionnaire de stocks | Opérationnel | PDF |
| Mécanicien | Opérationnel | PDF |
| Conducteur d'engins | Opérationnel | PDF |
| Gardien | Opérationnel | PDF |
| Chauffeur | Opérationnel | PDF |

**Chaîne hiérarchique interne — arrêtée.**

```
Chef de Service Logistique
├── Gestionnaire de stocks
└── Chef du Garage
    ├── Mécanicien
    ├── Conducteur d'engins
    ├── Chauffeur
    └── Gardien
```

Le Chef de Service Logistique dirige le service, sans autre attribution. Le Chef
du Garage encadre l'équipe technique ; le gestionnaire de stocks relève
directement du responsable, son activité n'étant pas celle du garage.

**Effet sur les circuits** : une demande de congé d'un mécanicien remonte au
Chef du Garage, celle du gestionnaire de stocks au Chef de Service Logistique,
celle du Chef du Garage au Chef de Service Logistique, et celle du Chef de
Service Logistique au Directeur Technique.

### A-07 · Composition de la Direction Financière et Comptable — **Arrêtée**

```
Directeur Financier et Comptable
├── Service Achats
│   └── Chef de Service Achats
└── Comptabilité
    └── Assistant comptable
```

**Encadrement de la Comptabilité — arrêté.** Le service ne compte qu'un
assistant comptable, sans poste de responsable intermédiaire. Le Directeur
Financier et Comptable en assure directement l'encadrement.

**Effet sur les circuits** : le Directeur Financier et Comptable est le N+1
de l'assistant comptable et du responsable service achats. Leurs demandes
de congé, de ressource et leurs dérogations lui remontent directement.

Ce n'est pas une lacune de l'organigramme mais une organisation voulue : un
service de cette taille n'appelle pas d'échelon intermédiaire.

### A-08 · Composition de la Direction Technique — **Arrêtée**

```
Directeur Technique
│
├── Service Études et Appels d'Offres
│   └── Chargé d'études et travaux                    ← responsable
│
├── Service Adduction d'Eau Potable
│   └── Chef de Service Adduction d'Eau Potable
│
├── Service Assainissement
│   └── Chef de Service Assainissement
│
├── Service Routes et Voiries
│   └── Chef de Service Routes et Voiries
│
├── Service Logistique
│   └── Chef de Service Logistique                        ← voir A-06
│
└── Chaîne chantier (transverse)
    ├── Conducteur de Travaux
    ├── Chef Chantier · Chef Chantier Adjoint
    └── Chef d'équipe
        └── Ouvrier · Manœuvre                        ← voir A-11
```

**Chaque service a désormais son chef.** Décision prise pour deux motifs :
décharger le Directeur Technique, et surtout remettre l'approbation au bon
niveau. Un chef de service sait si son équipe peut se passer d'un agent une
semaine donnée ; le Directeur Technique ne peut pas
l'apprécier pour cinq services à la fois.

**Le Chargé d'études et travaux porte deux fonctions.** Il est responsable
du Service Études et Appels d'Offres, et intervient dans la chaîne chantier
au même titre que le Conducteur de Travaux.

### A-08 bis · Deux chaînes distinctes — **Arrêtée**

Point structurant, apparu en cadrant la Direction Technique : **la chaîne
hiérarchique et la chaîne fonctionnelle ne se confondent pas.**

| Chaîne | Objet | Qui décide |
| --- | --- | --- |
| **Hiérarchique** | Congés, permissions, demandes de ressources | Le N+1 au sens de la section B |
| **Fonctionnelle** | Visa des relevés d'activité, planning de chantier, avancement | Le Conducteur de Travaux ou le Chargé d'études du chantier concerné |

Le Conducteur de Travaux **n'est pas** le supérieur hiérarchique du Chef
Chantier — celui-ci relève directement du Directeur Technique. Mais il reste
son référent fonctionnel sur le chantier : c'est lui qui vise les relevés
d'activité et arbitre le planning.

**Effet sur le modèle** : `Affectation.superieurId` porte le lien
hiérarchique. Le lien fonctionnel se déduit du chantier —
`AffectationChantier` relie l'agent au projet, dont le conducteur est connu.
Les deux ne doivent pas être confondus dans le code.

**Chaîne d'approbation hiérarchique :**

| Poste | Supérieur hiérarchique |
| --- | --- |
| Ouvrier · Manœuvre | Chef d'équipe |
| Chef d'équipe | Chef Chantier |
| Chef Chantier · Chef Chantier Adjoint | Directeur Technique |
| Conducteur de Travaux | Directeur Technique |
| Agents des services techniques | Chef de leur service |
| Chefs de Service — AEP, Assainissement, Routes, Logistique | Directeur Technique |
| Chargé d'études et travaux | Directeur Technique |
| Directeur Technique | Directeur Général |

**Charge d'approbation du Directeur Technique.** Elle reste notable — quatre
chefs de service, le chargé d'études, les conducteurs de travaux, les
chefs de chantier et leurs adjoints — mais elle est désormais tenable.

La délégation nommée de B-03 demeure vivement recommandée pour ce poste :
son absence bloquerait encore une part importante des circuits.

### A-10 · Composition de la Direction Administrative et RH — **Arrêtée**

```
Directrice Administrative et RH
├── Assistant RH
├── Service QHSE
│   └── Chef de Service QHSE
│       └── Assistant QHSE
│           └── Relais QHSE
├── Coursier
└── Technicien de surface
```

**Le Service QHSE a une chaîne à trois niveaux**, contrairement aux autres
services où le chef encadre directement son équipe. Le Relais QHSE relève
de l'Assistant QHSE, qui relève du Chef de Service.

**Chaîne d'approbation :**

| Poste | Supérieur hiérarchique |
| --- | --- |
| Relais QHSE | Assistant QHSE |
| Assistant QHSE | Chef de Service QHSE |
| Chef de Service QHSE | Directrice Administrative et RH |
| Assistant RH · Coursier · Technicien de surface | Directrice Administrative et RH |
| Directrice Administrative et RH | Directeur Général |

> Le poste est intitulé au féminin dans l'organisation actuelle. Le
> référentiel retient **Directeur Administratif et RH** comme libellé de
> poste — le genre appartient à la personne, pas au poste, et le libellé
> doit rester valable au changement de titulaire.

### A-11 · Main-d'œuvre de chantier — **Arrêtée**

Les agents de chantier ne forment pas une population homogène. Mais la
distinction n'est pas celle envisagée initialement : **le prestataire n'est
pas une catégorie de personnel, c'est un fournisseur.**

| Origine | Suivi par ITA | Paiement |
| --- | --- | --- |
| **Permanent** | Dossier complet | Salaire mensuel |
| **Journalier ITA** | Dossier allégé | Taux journalier × jours pointés |
| **Prestataire** | **Aucun suivi nominatif** | Facturation du contrat, sur objectif |

**ITA ne suit pas les agents d'un prestataire.** Le prestataire organise son
équipe comme il l'entend ; ITA regarde l'objectif contractuel. Aucune fiche
individuelle, aucun pointage, aucun effectif à saisir.

Conséquence : `TypeMainOeuvre` ne compte que **deux valeurs** — `PERMANENT`
et `JOURNALIER`. Le prestataire vit dans son propre modèle, sans lien vers
des personnes.

**Couverture du risque QHSE — arrêtée.** Des agents non enregistrés
travaillent sur les chantiers d'ITA : en cas d'accident ou de contrôle,
l'application n'en portera aucune trace.

La couverture est **contractuelle et non logicielle**. Le contrat type de
prestation doit porter explicitement :

- l'obligation d'assurance responsabilité civile et accident du travail ;
- la conformité sociale du prestataire pour ses propres agents ;
- l'obligation de respecter les consignes QHSE du chantier ;
- la responsabilité pleine du prestataire sur son personnel.

Le contrat signé étant une pièce obligatoire à l'enregistrement — A-14 —
ces clauses sont vérifiables à tout moment depuis l'application.

### A-12 · Dossier du journalier ITA — **Arrêtée**

Quatre éléments, pas davantage.

| Champ | Nature |
| --- | --- |
| Nom | requis |
| Prénom | requis |
| Téléphone | requis — **sert aussi de compte de paiement mobile** |
| Pièce d'identité | requis — document déposé |

**Le téléphone n'est pas qu'un contact.** Le journalier est payé par
transfert d'argent mobile. Le numéro devient donc une **donnée de
paiement** : une erreur de saisie envoie l'argent à un tiers, sans recours.

**Opérateur retenu : Wave, à l'exclusion de tout autre.** L'énumération n'en
compte qu'une valeur. Ajouter Orange Money ou MTN MoMo resterait une
migration d'une ligne, sans changement de structure — inutile de les
prévoir tant qu'ils ne servent pas.

Le numéro de paiement est **distinct du téléphone de contact** : les deux
peuvent différer, et les confondre coûterait cher.

Trois conséquences :

- Le numéro est vérifié à la saisie et confirmé une seconde fois.
- Toute modification est journalisée, au même titre qu'un changement de RIB.
- Il relève de la classification **Sensible** au sens de `SECURITE.md` § 2.

**Ce que le journalier n'a pas** : ni numéro CNPS exigé, ni situation
matrimoniale, ni adresse, ni email, ni les sept pièces du dossier permanent.

### A-13 · Congés du journalier ITA — **Arrêtée**

Un journalier **n'ouvre aucun compteur de congés**. Seule l'absence non
payée s'applique : un jour non pointé est un jour non payé.

Conséquences :

- Aucun enregistrement dans `SoldeConges`.
- Exclu du module Congés & Permissions — ni demande, ni validation.
- Une absence se constate au relevé d'activité, elle ne se demande pas.

Cela clôt la question B-05 pour cette population : les règles de congés de
`RegleConges` ne concernent que les permanents.

### A-14 · Prestataires et facturation — **Partiellement arrêtée**

Le prestataire est un **fournisseur de main-d'œuvre**, enregistré comme
entité et non comme personnel.

**Informations attendues :**

| Bloc | Contenu |
| --- | --- |
| Identité | Personne physique **ou** entreprise — raison sociale, RCCM, compte contribuable, contact, téléphone, adresse |
| Contrat | Projet concerné, période, mode de facturation, montant ou taux |
| Pièce jointe | **Contrat signé, obligatoire** |

**Deux modes de facturation**, et deux seulement :

| Mode | Base de calcul |
| --- | --- |
| Forfait | Montant fixe pour la période ou la prestation |
| À la tâche | Unité d'ouvrage réalisée × prix unitaire |

**Le taux journalier est écarté.** ITA ne pointant pas les agents du
prestataire, aucun décompte de jours ne serait justifiable. Le mode est
absent du modèle, non désactivé — pour qu'il ne réapparaisse pas par
inadvertance.

**Circuit de facturation.** Distinct de la paie chantier : il ne dépend
d'aucun relevé d'activité. Une facture de prestation est rattachée à son
contrat, visée par la Direction Technique — service fait — puis transmise à
la Direction Financière pour règlement.

### A-09 · Récapitulatif de l'encadrement

| Unité | Chef ou encadrant | Source |
| --- | --- | --- |
| Direction Générale | Directeur Général | Confirmé |
| Direction Financière et Comptable | Directeur Financier et Comptable | Confirmé |
| Service Achats | Chef de Service Achats | Confirmé |
| Comptabilité | *Directeur Financier, directement* | A-07 |
| Direction Technique | Directeur Technique | Confirmé |
| Service Études et Appels d'Offres | Chargé d'études et travaux | A-08 |
| Service Adduction d'Eau Potable | Chef de Service AEP | A-08 |
| Service Assainissement | Chef de Service Assainissement | A-08 |
| Service Routes et Voiries | Chef de Service Routes et Voiries | A-08 |
| Service Logistique | Chef de Service Logistique | A-06 |
| Direction Administrative et RH | Directeur Administratif et RH | Confirmé |
| Service QHSE | Chef de Service QHSE | A-10 |

Toutes les unités ont désormais un encadrement identifié.

**Convention d'intitulé — arrêtée** : « Chef de Service … ».

Appliquée à l'ensemble des responsables de service, y compris ceux déjà
inscrits — le Responsable service achats devient Chef de Service Achats, le
Responsable Logistique devient Chef de Service Logistique.

Deux postes conservent leur intitulé propre, car ils ne suivent pas cette
forme : le **Chef du Garage**, qui figure ainsi au PDF, et le **Chargé
d'études et travaux**, dont l'intitulé désigne le métier autant que la
fonction d'encadrement.

---

## B — Circuits d'approbation

### B-01 · Principe général — **Arrêtée**

Toute demande passe d'abord par le **responsable hiérarchique direct** du
demandeur pour approbation d'opportunité, puis par le **service compétent**
pour approbation fonctionnelle.

Les deux approbations n'ont pas le même objet :

| Étape | Qui | Ce qu'il apprécie |
| --- | --- | --- |
| Hiérarchique | Le N+1 | L'opportunité — le service peut-il s'en passer |
| Fonctionnelle | Le service compétent | Le droit et la faisabilité — solde, budget, disponibilité |

### B-02 · Un seul niveau hiérarchique — **Arrêtée**

L'approbation s'arrête au **N+1 direct**. Aucune remontée en cascade.

Motif : au-delà, le circuit devient trop lent pour une demande de congé et
sera contourné par téléphone.

### B-03 · Délégation en cas d'absence — **Arrêtée**

Chaque responsable désigne **à l'avance** un délégataire nommé. En son
absence, les demandes lui sont routées automatiquement.

Aucune remontée automatique au N+2, aucun blocage silencieux.

Implication : il faut un écran de gestion des délégations et un champ
`delegataireId` sur l'employé, avec période de validité.

### B-04 · Terminaison de la chaîne — **Arrêtée**

- Les demandes des **directeurs** passent directement à l'étape fonctionnelle.
- Les demandes du **Directeur Général** sont réputées approuvées à l'étape
  hiérarchique.

### B-05 · Auto-approbation — **Arrêtée**

Interdite dans tous les cas, y compris si une erreur de saisie désigne
quelqu'un comme son propre supérieur. Contrôle bloquant en base et en
application.

### B-06 · Relance — **Arrêtée**

Une demande sans réponse déclenche un **courriel de relance** au responsable,
via Resend. Le délai dépend du niveau d'urgence :

| Urgence | Délai de relance | Relances |
| --- | --- | --- |
| Critique | 24 heures | toutes les 24 h |
| Haute | 3 jours | tous les 2 jours |
| Normale | 5 jours | tous les 3 jours |

Aucune remontée ni approbation automatique. Une demande non traitée reste
en attente.

### B-07 · Refus hiérarchique — **Arrêtée**

Le refus du N+1 est **définitif**. Aucun recours au N+2 dans l'application.

Le motif du refus est obligatoire et visible par le demandeur.

### B-08 · Circuits résultants — **Arrêtée**

| Demande | Circuit |
| --- | --- |
| Congé / permission | Demandeur → **N+1** → Direction RH |
| Ressource humaine | Demandeur → **N+1** → Direction Technique → Direction RH |
| Ressource logistique | Demandeur → **N+1** → Chef du Garage |
| Dérogation salariale | Assistant RH → **Directrice RH** → Direction Financière |
| Relevé d'activité | Chef de chantier → Conducteur de travaux |
| Appel d'offres | Chargé d'études → Directeur Technique → **Directeur Général** |
| Période de paie chantier | RH → Direction Technique → Direction Financière |

### B-09 · Supérieur hiérarchique obligatoire — **Arrêtée**

Le champ `superieurId` devient **obligatoire** à la création d'un profil,
sauf pour le Directeur Général.

Un employé sans supérieur produit une demande qui ne part nulle part.

Implication : un écran de contrôle de cohérence hiérarchique est requis —
employés sans supérieur, boucles, responsables surchargés.

### B-08 bis · Arbitrage des demandes de ressources — **Arrêtée**

Corrige **B-08**, écrite avant la création du poste de Chef de Service
Logistique en A-06.

| Étape | Qui |
| --- | --- |
| Demande | Chef de chantier, ou tout employé |
| Visa hiérarchique | Supérieur du demandeur — B-01 |
| **Arbitrage** | **Chef de Service Logistique** — il décide de l'affectation du parc |
| **Exécution** | **Chef du Garage** — il met à disposition |

**Le premier arbitre, le second exécute.** C'est la structure réelle depuis
A-06 : le Chef du Garage encadre l'équipe technique sous l'autorité du Chef
de Service.

Deux permissions distinctes : `ressource:arbitrer` et
`ressource:mettreADisposition`.

> B-08 disait « Chef du Garage » pour l'arbitrage. C'était juste au moment de
> sa rédaction, et faux depuis A-06.

---

## C — Rôles applicatifs

### C-01 · Rôles retenus — **Par défaut, titulaires à confirmer**

Le rôle applicatif est distinct du poste. Un employé peut porter plusieurs
rôles.

| Code | Rôle | Titulaire | Périmètre |
| --- | --- | --- | --- |
| `ADMIN` | Super Admin | **Armel Gnakpa** — identifiant `itajoy` | Tout, y compris règles et référentiels |
| `DG` | Directeur Général | Dr Jules Konan | Go/no-go et visa des appels d'offres |
| `DRH` | Directrice Administrative et RH | *à désigner* | Employés, congés, dossiers, dérogations |
| `RH` | Assistant RH | *à désigner* | Saisie sans validation |
| `DFC` | Directeur Financier | *à désigner* | Grille salariale, dérogations, paiement |
| `DT` | Directeur Technique | *à désigner* | Projets, planning, jalons, présences |
| `CT` | Conducteur de Travaux | *à désigner* | Planning, visa des relevés |
| `CC` | Chef de Chantier | *à désigner* | Saisie des relevés, demandes de ressources |
| `CE` | Chargé d'études | *à désigner* | Appels d'offres |

> Le rôle `ADMIN` ne doit jamais être porté par un compte partagé. Chaque
> administrateur dispose d'un compte nominatif distinct — voir C-03.

### C-02 · Compte Super Admin — **Arrêtée**

| Élément | Valeur |
| --- | --- |
| Personne | Armel Gnakpa |
| Adresse de connexion | `armelgnakpa7@gmail.com` |
| Nature | **Accès technique de maintenance** |
| Rattachement à un employé | Aucun — `Profil` sans `Employe` lié |
| Identifiant historique | `itajoy`, conservé pour mémoire |

Conséquences du caractère technique :

- N'apparaît pas dans l'organigramme.
- Ne peut être le supérieur hiérarchique de personne.
- Ne reçoit aucune demande d'approbation.
- Est exclu des effectifs et de la masse salariale.

### C-03 · Cycle de vie des accès d'administration — **Par défaut, à confirmer**

Un compte de maintenance détenant tous les droits sur des données
personnelles appelle trois précautions.

**1. Double authentification obligatoire.** Sans exception, dès la première
connexion. Ce compte peut modifier les permissions de tous les autres.

**2. Un second administrateur interne à prévoir.** Un unique détenteur du
rôle `ADMIN` est un point de rupture : si Armel Gnakpa devient indisponible,
plus personne ne peut créer de compte ni modifier une règle. Prévoir un
second compte nominatif, porté par un dirigeant d'ITA, avant la mise en
exploitation.

> Correction d'une formulation antérieure : la règle est l'absence de compte
> **partagé**, non la limitation à un seul administrateur. Deux comptes
> nominatifs distincts sont préférables à un seul.

**3. Adresse personnelle : à revoir avant l'exploitation.** L'adresse
retenue est un compte Gmail personnel, hors du contrôle d'ITA. Trois
limites en découlent :

- ITA ne peut ni suspendre ni récupérer cet accès en cas de besoin.
- Le départ du prestataire n'entraîne aucune coupure automatique.
- La récupération du compte dépend d'un tiers.

Recommandation : basculer vers une adresse du domaine — par exemple
`armel@itamanager.cloud` — avant la mise en exploitation réelle. L'adresse
Gmail reste acceptable pendant la phase de construction.

**Échéance de revue** : à la clôture de M0.

### C-04 · Garde-fous de l'administration des accès — **Arrêtée**

Trois interdits en dur, vérifiés côté serveur, indépendants de toute
permission :

- Retirer le rôle `ADMIN` à son dernier détenteur
- Se désactiver soi-même
- Se retirer son propre rôle `ADMIN`

Motif : chacun de ces gestes verrouillerait l'application pour tout le
monde, et seule une intervention directe en base la débloquerait.

**Attribution par rôle, non par permission.** L'écran d'administration
attribue et retire des rôles entiers, sans exposer les permissions
unitaires. Le modèle le permettrait, mais l'attribution à la carte double
la surface d'erreur sans usage réel à cette échelle.

**Deux détenteurs de `admin:utilisateurs`** : le Super Admin et la Direction
RH — celle-ci crée les profils employés et doit pouvoir leur ouvrir un accès.
**`admin:parametres` et `admin:journal` restent au seul Super Admin.**

> Ce garde-fou rend la décision C-03 plus pressante : tant qu'il n'existe
> qu'un administrateur, il ne peut pas se retirer lui-même. Protecteur,
> mais rigide.

---

## D — Architecture

### D-01 · Ordre de construction — **Arrêtée**

Interface puis backend, **module par module**. Chaque module va jusqu'en
production avant l'ouverture du suivant.

| # | Module | Contenu | Dépend de |
| --- | --- | --- | --- |
| **M0** | Socle | Authentification, mise en page, permissions, déploiement | — |
| **M1** | Organisation | Directions, services, postes, organigramme | M0 |
| **M2** | Employés | Profils, contrats, documents, cascade d'affectation | M1 |
| **M3** | Congés | Demandes, validation, soldes, règles | M2 |
| **M4** | Rémunération | Grille salariale, dérogations | M2 |
| **M5** | Projets | Création, planning, Gantt, jalons | M1 |
| **M6** | Relevés d'activité | Pointage chantier, visa, saisie tablette | M5 |
| **M7** | Paie chantier | Cycles, périodes, circuit RH → DT → DFC | M4, M6 |
| **M8** | Ressources | Demandes de ressources — **le demandeur est ici, M13 arbitre** | M5, M13 |
| **M9** | Appels d'offres | Veille, go/no-go DG, dossier, résultat | M1 |
| **M10** | Pilotage | Tableaux de bord, notifications, accès mobile DG | tous |
| **M11** | Administration | Paramètres, journal d'audit, aide | tous |
| **M12** | Présences bureau | Borne d'accueil, registre de présence | M2 |

### Modules hors première version

Décidés après le cadrage initial. Ils n'entrent pas dans `v1.0.0`.

| # | Module | Contenu | Dépend de |
| --- | --- | --- | --- |
| **M13** | Logistique & Parc | Registre, échéances, stocks, inspections, transport | M2, M5 |
| **M14** | Achats | Demande, comité, bon de commande, réception, facturation | M1, M2, M13 |
| **M15** | **ItaPay** | **Exécution des paiements Wave**, autorisation DG | M6, M7, M14 |

> ⚠️ **M15 est le seul module qui fait sortir de l'argent.** Il exige un
> document de sécurité dédié — `SECURITE-M15.md` — en plus du dossier de
> module.

**M0 à M2 forment le socle indispensable.** Au-delà, l'ordre peut être
révisé selon les priorités métier.

**M12 est délibérément placé en dernier** : le pointage bureau n'alimente
aucun calcul de paie — voir E-08. C'est le module dont l'absence coûte le
moins cher.

### D-02 · Authentification — **Arrêtée**

Supabase Auth. Aucune couche supplémentaire.

| Étape | Mécanisme |
| --- | --- |
| Connexion | Email + mot de passe, 12 caractères minimum |
| Première connexion | Accès temporaire envoyé par courriel, changement imposé |
| Second facteur | **TOTP** — application d'authentification, obligatoire pour les rôles privilégiés |
| Verrouillage | **20 minutes d'inactivité**, déverrouillage au mot de passe |
| Pointage à la borne | Code personnel à 5 chiffres, **cloisonné**, sans accès aux données |

#### Pourquoi pas de code à 4 chiffres en plus du mot de passe

Un code numérique ajouté au mot de passe **n'est pas un second facteur**.
Les deux relèvent de « quelque chose que l'on sait », transitent par le même
canal et se dérobent ensemble. La friction est quotidienne, le gain proche
de zéro.

Pire s'il sert à déverrouiller la session : un code à 4 chiffres qui rouvre
un accès protégé par un mot de passe de 12 caractères **ramène toute la
chaîne au maillon le plus faible**.

Le second facteur retenu est donc TOTP — « quelque chose que l'on
possède » — conformément à `SECURITE.md` § 3.

#### Le code à 5 chiffres reste, mais cloisonné

Il sert **uniquement** au pointage à la borne d'accueil, décision E-08. Il
ne donne accès à aucune donnée. Le pire qu'il permette est un pointage
frauduleux, sans effet sur la paie.

**Un seul code à retenir**, pas deux.

### D-08 · Double authentification TOTP — **Arrêtée**

**Imposée**, dès la première connexion. Tous les détenteurs de rôle
disposent d'un smartphone, la condition matérielle est levée.

| Élément | Choix |
| --- | --- |
| Mécanisme | TOTP — code à 6 chiffres renouvelé toutes les 30 secondes |
| Applications | Google Authenticator, Microsoft Authenticator, Authy |
| Rôles concernés | `ADMIN`, `DG`, `DRH`, `DFC`, `DT` — **obligatoire** |
| Autres rôles | Facultatif, encouragé — voir la réserve ci-dessous |
| Activation | Imposée à la première connexion pour les rôles concernés |

**Motif.** Un mot de passe et un code numérique relèvent tous deux de « ce
que l'on sait » : même vol, même hameçonnage, même regard par-dessus
l'épaule. TOTP relève de « ce que l'on possède » — il faut le téléphone en
main, et un code intercepté est périmé trente secondes plus tard.

#### Récupération — à ne pas négliger

Un directeur qui change de téléphone perd son second facteur. Sans
procédure, il est bloqué. Deux parades, à mettre en place ensemble :

**Codes de secours.** Dix codes à usage unique, générés à l'activation,
affichés une seule fois, à imprimer et ranger en lieu sûr.

**Réinitialisation par le Super Admin.** Il retire le second facteur,
l'intéressé le reconfigure. **Action journalisée** : c'est un
affaiblissement temporaire de la sécurité, il doit rester traçable.

#### Rôles de terrain — décision différée, échéance fixée

Le Chef de Chantier et le Conducteur de Travaux restent en **facultatif**
pendant la phase d'adoption. Décision réexaminée **six à huit semaines
après la mise en exploitation**.

**Motif.** Les deux populations ne portent pas le même risque.

| Population | Risque d'un compte compromis | Risque de la friction |
| --- | --- | --- |
| ADMIN, DG, DRH, DFC, DT | Paiements validés, grilles modifiées, dossiers RH consultés | Faible — usage au bureau |
| CC, CT | Pointage faussé, rattrapé par le visa | **Élevé — abandon du relevé, et la paie chantier s'effondre** |

Imposer une friction pendant l'adoption, c'est ajouter un obstacle au moment
où il coûte le plus cher. L'ajouter une fois l'outil devenu un réflexe coûte
beaucoup moins.

**Trois signaux déclenchent une décision anticipée :**

1. Un incident de sécurité, même mineur, sur un compte terrain
2. Un partage de mot de passe constaté — deux personnes, un compte
3. À l'inverse : si la majorité des rôles terrain active TOTP spontanément,
   généraliser sans attendre — la friction est mieux acceptée que prévu

**Deux mesures d'accompagnement, à mettre en place dès M0 :**

- **Activation visible et accessible** — proposée dans le menu utilisateur,
  non enfouie dans les paramètres
- **Session longue sur tablette de chantier** — si le chef de chantier reste
  connecté la journée, le second facteur devient quotidien au lieu de
  permanent. Cela change tout à l'acceptation.

### D-07 · Verrouillage de session — **Arrêtée**

La session se verrouille après **20 minutes sans interaction**.

| Élément | Choix |
| --- | --- |
| Délai | 20 minutes, paramétrable dans Paramètres |
| Effet | Écran de verrouillage, session conservée |
| Déverrouillage | Mot de passe. Ni code, ni second facteur. |
| Après 8 heures | Déconnexion complète, nouvelle authentification |
| Exception | La borne de pointage ne se verrouille pas — elle n'expose rien |

**Motif** : les postes sont partagés et les bureaux ouverts. Une session
laissée ouverte donne accès aux dossiers du personnel, aux salaires et aux
RIB à quiconque passe.

Un travail en cours n'est pas perdu : le brouillon automatique de E-03 s'en
charge.

### D-03 · Autorisation — **Arrêtée**

Couche applicative via la matrice de permissions. Prisma contourne les Row
Level Security ; les RLS ne sont conservées que sur Supabase Storage.

### D-04 · Migrations — **Arrêtée**

Prisma Migrate exclusivement. Aucune modification de schéma depuis le
tableau de bord Supabase.

### D-05 · Création des comptes — **Arrêtée**

La création d'un employé ne crée pas de compte. Une action explicite
« Ouvrir un accès » envoie une invitation par courriel.

Motif : tous les ouvriers n'ont pas d'adresse électronique.

### D-06 · Projet et chantier — **Arrêtée**

Un projet **est** un chantier. Un seul modèle porte le marché, le planning
et le cycle de paie.

### D-10 · Le refus d'un achat n'est pas définitif — **Arrêtée**

La décision **B-07** pose qu'un refus hiérarchique est définitif, sans
recours. Elle vaut pour les congés et les demandes de ressources.

**Les demandes d'achat font exception.** Une demande refusée revient en
correction et se resoumet, en conservant son historique et le motif du refus.

**Motif.** Refuser un congé, c'est refuser une absence — le besoin disparaît
avec le refus. Refuser un achat, c'est presque toujours en demander un autre :
moins cher, plus tard, d'un autre fournisseur, en quantité moindre.

Obliger à recréer une demande ferait perdre le fil et le motif du refus.

**Conséquence technique** : tous les avis du comité sont **réinitialisés** à
la resoumission. Pas de fusion partielle — un directeur qui avait approuvé une
demande à trois millions doit se prononcer à nouveau sur la version à deux
millions.

### D-11 · Deux gestes distincts sur l'urgence d'un achat — **Arrêtée**

| Acteur | Geste | Portée |
| --- | --- | --- |
| Demandeur | **Signale** un besoin urgent, avec motif | Information — remonte la demande en tête de file d'instruction |
| Chef de Service Achats | **Déclare** l'urgence | Décision — dispense du comité sous `achat.plafondUrgence` |

Signaler est une information de terrain. Déclarer engage la responsabilité de
qui contourne le comité.

**Le signalement ne dispense de rien.**

### D-12 · Pas de contrôle budgétaire sur les achats — **Arrêtée**

L'imputation d'une demande à un chantier ou à un service sert à **savoir qui
dépense**, non à bloquer une dépense.

**Motif.** Un contrôle budgétaire suppose des budgets établis, tenus et
révisés. Ce n'est ni décidé ni en place chez ITA. Le construire sans les
budgets produirait des blocages arbitraires, ou un contrôle désactivé — donc
inutile.

Ce que le module fournit à la place : le **montant engagé par chantier et par
service**, au tableau de suivi. C'est la matière première d'un budget futur.

Si un budget de chantier est décidé — décision ouverte de M5 — le contrôle
s'ajoutera dans une version ultérieure.

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

### E-01 · Pagination serveur — **Arrêtée**

Toute liste est paginée **côté serveur**. Aucun chargement complet en mémoire.

| Élément | Choix |
| --- | --- |
| Méthode | Décalage — `page` et `taille` — sauf journal d'audit, en curseur |
| Taille par défaut | 25 lignes |
| Tailles proposées | 25 · 50 · 100 |
| État de la vue | Dans l'URL, via `searchParams` |

**Conséquence** : recherche, filtres et tri passent aussi au serveur. Un
filtre en mémoire sur une page paginée ne filtrerait que la page affichée,
ce qui donne un résultat faux sans le signaler.

L'état vit dans l'URL — `?q=dosso&direction=DT&page=2` — pour trois raisons :
le lien est partageable, le retour arrière fonctionne, et l'actualisation ne
perd pas la vue.

> ⚠️ Le patron 3 déjà produit filtre en mémoire. Il doit être révisé avant
> M2. Voir `PATRONS.md`.

Le journal d'audit fait exception : pagination par curseur, car les
événements s'ajoutent en continu et la pagination par décalage y produirait
des doublons ou des sauts.

### E-02 · Modale pour la création et la modification — **Arrêtée**

La création et la modification se font en **modale**, tant que le formulaire
tient en trois onglets ou moins.

Au-delà, page dédiée. Deux écrans sont concernés :

| Écran | Forme | Motif |
| --- | --- | --- |
| Employé | Modale, 3 onglets | Limite atteinte |
| Relevé d'activité | **Page dédiée** | Pointage, travaux, matériel, matériaux, incidents |
| Dossier d'appel d'offres | **Page dédiée** | Quatre étapes plus les pièces |

### E-03 · Brouillons enregistrés automatiquement — **Arrêtée**

Les formulaires longs enregistrent leur brouillon automatiquement, sans
action de l'utilisateur.

| Élément | Choix |
| --- | --- |
| Déclenchement | 2 secondes après la dernière frappe, et au changement d'onglet |
| Portée | Un brouillon par utilisateur et par entité |
| Signalement | « Enregistré à 14 h 32 » près du titre, discret |
| Reprise | À l'ouverture, proposition de reprendre ou de repartir de zéro |
| Purge | Brouillon supprimé à la soumission, ou après 30 jours d'inactivité |

**Trois conséquences à assumer :**

**Le schéma de validation doit exister en deux versions.** Un brouillon est
incomplet par nature : zod ne peut pas exiger les champs obligatoires. Chaque
schéma est donc décliné en `xSchema` pour la soumission et
`xSchema.deepPartial()` pour le brouillon.

**Le modèle de données porte les brouillons.** Un modèle `Brouillon` est
requis — `utilisateurId`, `entite`, `entiteId` optionnel, `donnees` en JSON,
`modifieLe`. À ajouter au schéma avant M2.

**Le relevé d'activité se saisit sur chantier**, où la connexion est
incertaine. Le brouillon y est d'abord local — `IndexedDB` — puis synchronisé
au retour du réseau. C'est le seul écran concerné par ce traitement, à
traiter en M6.

### E-04 · Notifications à trois niveaux — **Arrêtée**

Pas de temps réel. Trois niveaux complémentaires, chacun avec son rôle.

| Niveau | Mécanisme | Déclencheur | Portée |
| --- | --- | --- | --- |
| 1 | **Toast** | Sa propre action | Sa session |
| 2 | **Compteurs** | Calcul serveur au rendu | Cloche et pastilles de menu |
| 3 | **Courriel Resend** | Événement appelant une action | Hors application |

**Niveau 2 — le détail qui compte.** Les compteurs sont calculés côté
serveur à chaque rendu, plus une revalidation **au retour sur l'onglet**.
L'utilisateur revient de sa boîte mail, les compteurs sont à jour. Quelques
lignes de code pour l'essentiel de la sensation de temps réel.

**Niveau 3 — le seul qui atteint vraiment les gens.** Dans un ERP à circuits
d'approbation, personne ne vit dans l'application : le conducteur de travaux
est sur chantier, le Directeur Général en réunion. Le courriel est ce qui
déclenche l'action.

Courriel court, **sans donnée sensible** : un objet, une phrase, un lien.
Le détail reste dans l'application.

### E-05 · Matrice des notifications — **Arrêtée**

| Événement | Toast | Compteur | Courriel |
| --- | :-: | :-: | :-: |
| Demande à valider — congé, ressource, dérogation | | ✅ | ✅ |
| Décision rendue sur ma demande | | ✅ | ✅ |
| Période de paie chantier à clôturer | | ✅ | ✅ |
| Jalon de planning en retard | | ✅ | ✅ |
| Contrat arrivant à échéance | | ✅ | ✅ |
| Habilitation ou certification qui expire | | ✅ | ✅ |
| Relevé d'activité en attente de visa | | ✅ | ✅ |
| Appel d'offres en attente du Directeur Général | | ✅ | ✅ |
| Ma propre action a abouti | ✅ | | |

**Règle d'exclusion** : aucune notification pour un événement purement
informatif. Une cloche qui sonne sans raison finit ignorée, y compris quand
elle a raison.

Les relances suivent le calendrier de B-06, selon le niveau d'urgence.

### E-06 · Temps réel — **Écarté pour l'instant**

Supabase Realtime a été envisagé puis écarté. Motifs :

- L'urgence réelle est faible. Deux secondes ou la prochaine ouverture de page ne changent rien à l'exploitation.
- Le plan gratuit plafonne les connexions simultanées.
- Un abonnement est un composant de plus à maintenir et à déboguer.

**Ce qu'on accepte de perdre** : deux personnes sur le même écran ne voient
pas les actions l'une de l'autre sans recharger. Cas rare sur ces volumes.

**La porte reste ouverte.** Le temps réel s'ajouterait sans rien défaire :
un abonnement à la table `notifications`, alimentant les mêmes compteurs.
Si un besoin concret apparaît — typiquement une file de validation partagée
entre plusieurs valideurs — la décision sera révisée.

---

### E-07 · Saisie sur chantier — **Arrêtée**

Le relevé d'activité est le seul écran saisi hors du bureau. Trois
contraintes le distinguent de tout le reste de l'application.

| Contrainte | Valeur |
| --- | --- |
| Appareil | **Tablette et ordinateur.** Jamais de téléphone. |
| Effectif à pointer | **Jusqu'à 20 agents** par relevé |
| Réseau | **Faible sur chantier**, jamais garanti |

#### Appareil — largeur minimale 768 px

L'application reste conçue pour le bureau. Seul le relevé d'activité doit
fonctionner à partir de 768 px, en tablette portrait.

- Cibles tactiles de **44 px minimum** sur cet écran, contre 32 px ailleurs
- Aucun survol porteur d'information : une infobulle inatteignable au doigt ne sert à rien
- Deux colonnes au maximum, jamais trois

#### Effectif — pointer par exception, non par saisie

Vingt agents à pointer représentent une soixantaine d'interactions si
chaque ligne demande un état, des heures et des heures supplémentaires.
C'est le chemin le plus sûr vers l'abandon et le retour au carnet papier.

**Principe retenu : tous présents par défaut.** À l'ouverture, chaque agent
affecté au chantier est présent, avec les heures théoriques de la journée.
Le chef de chantier ne saisit que les **écarts**.

- Les lignes conformes restent visuellement discrètes
- Les exceptions — retard, absence — ressortent en couleur
- L'œil trouve les écarts sans lire les vingt lignes
- Une action « tous présents » rétablit l'état initial

Sur une journée normale, la saisie du pointage tombe à zéro interaction.

#### Réseau — saisie locale d'abord

Le brouillon est écrit **localement** avant toute tentative d'envoi, dans
`IndexedDB`. La synchronisation se fait en arrière-plan dès que le réseau
le permet.

- Un indicateur permanent montre l'état : `Enregistré localement` · `Synchronisé à 14 h 32` · `En attente de réseau`
- La perte de connexion n'interrompt jamais la saisie
- La soumission pour visa exige d'être en ligne, et le dit clairement
- Un relevé ouvert sur deux appareils : dernière écriture retenue, avec avertissement

C'est le seul écran à ce régime. Partout ailleurs, le brouillon serveur de
E-03 suffit.

#### Ce qui en découle

Cet écran justifie un **patron distinct** — saisie tablette hors ligne — qui
ne sera produit qu'en M6. Il ne réutilise ni le patron 4, conçu pour la
modale de bureau, ni le patron 6 tel quel.

> Le risque réel de cette application n'est pas esthétique. C'est qu'un chef
> de chantier abandonne le relevé au bout de trois jours et revienne au
> carnet papier. Si cela arrive, la paie chantier s'effondre : elle repose
> entièrement sur ces pointages.

### E-08 · Deux dispositifs de pointage, sans recouvrement — **Arrêtée**

| Dispositif | Population | Lieu | Finalité |
| --- | --- | --- | --- |
| **Relevé d'activité** | Équipes de chantier — permanents et journaliers | Chantier, tablette | **Paie chantier** et avancement |
| **Borne d'accueil** | Employés de bureau | Siège, tablette fixe | **Liste de présence** seulement |

**Aucun agent n'est pointé deux fois.** Le chef de chantier continue de
pointer son équipe dans son relevé ; la borne ne concerne que le personnel
du siège.

#### Borne d'accueil

Fonctionnement : l'employé saisit un **code personnel à 5 chiffres**, une
fois à l'arrivée, une fois au départ.

| Élément | Choix |
| --- | --- |
| Identifiant | Code à 5 chiffres, personnel, distinct du mot de passe applicatif |
| Portée | Enregistrer une présence. **Aucun accès aux données.** |
| Finalité | Liste de présence — **aucun effet sur la paie** |
| Appareil | Tablette fixe à l'accueil, authentifiée comme appareil |

**Le pointage bureau n'alimente aucun calcul.** Les permanents sont au
salaire mensuel : la borne produit un registre de présence, pas une base de
rémunération. Ni heures supplémentaires, ni retenue.

Conséquence directe : **la criticité de ce module est faible.** Une panne de
borne fait perdre un registre, pas un salaire. Il peut être repoussé sans
conséquence si le calendrier se tend.

> ⚠️ **Pointage pour autrui.** Un code à 5 chiffres se communique en trois
> secondes. La borne doit être authentifiée comme appareil — sinon
> n'importe qui pointe depuis son téléphone, de chez lui. Au-delà, la
> parade relève de l'organisation : présence d'un agent d'accueil, ou
> photo à la validation. Le risque reste mesuré, le pointage n'ayant
> aucun effet sur la paie.

### E-09 · Accès mobile du Directeur Général — **Arrêtée**

**Périmètre strict : recevoir et valider.** Pas de consultation de tableaux
de bord, pas de saisie, pas de navigation dans les modules.

| Élément | Choix |
| --- | --- |
| Forme | **Web adaptatif**, pas d'application native |
| Écrans | Liste des éléments en attente · fiche de décision · valider ou refuser |
| Objets concernés | Appels d'offres — go/no-go et visa · dérogations salariales · congés relevant de lui |
| Authentification | Identique au bureau, second facteur compris |

**Aucune application native.** Deux écrans adaptés au téléphone suffisent.
Une application native imposerait deux magasins, deux cycles de publication
et une maintenance propre, pour un usage limité à deux boutons.

Ces écrans sont produits en **M10**, avec les notifications : sans elles, un
accès mobile de validation n'a pas d'objet.

---

## G — Décisions en attente

| # | Sujet | Bloque |
| --- | --- | --- |
| G-01 | Titulaires des rôles DRH, RH, DFC, DT, CT, CC, CE (C-01) | M2 |
| G-02 | **Généraliser TOTP aux rôles de terrain ?** (D-08) — revue 6 à 8 semaines après mise en exploitation, ou plus tôt si l'un des trois signaux se produit | rien |
| G-03 | Second administrateur nominatif interne (C-03) | exploitation réelle |
| G-04 | Bascule vers une adresse du domaine pour l'accès de maintenance (C-03) | exploitation réelle |
| G-05 | Correction et re-signature de l'organigramme (A-02, A-04) | rien, mais à traiter |
| G-06 | Taux journalier des permanents : salaire ÷ 26 ? | M7 |
| G-07 | Jours fériés ivoiriens à charger | M3 |
| G-08 | Passage aux offres payantes Vercel et Supabase | exploitation réelle · **M15** |
| ~~G-09~~ | ~~Incohérence B-08~~ — **résolue** : arbitrage au **Chef de Service Logistique**, exécution au Chef du Garage. Voir B-08 bis | — |
| G-10 | **Déploiement de M15** — liste blanche Wave, signature seule, ou passerelle dédiée | M15 en production |

## H — Actions hors application

Décisions arrêtées, mais dont l'exécution ne relève pas du logiciel.

| # | Action | Responsable | Échéance |
| --- | --- | --- | --- |
| H-01 | Porter au contrat type de prestation les clauses d'assurance, de conformité sociale et de responsabilité QHSE (A-11) | Direction Générale | avant M7 |
| H-02 | Corriger et faire signer l'organigramme officiel — quatorze postes omis, Service Logistique rattaché à la DT (A-02, A-04) | Direction Générale | à convenance |
| H-03 | Déclarer le traitement de données personnelles auprès de l'ARTCI (`SECURITE.md` § 1) | Direction Générale | avant mise en exploitation |
| H-04 | Rédiger et remettre la notice d'information aux employés (`SECURITE.md` § 1) | Direction RH | avant mise en exploitation |

**Cadrage organisationnel et fonctionnel clos.** 4 directions, 8 services,
30 postes, encadrement complet. Main-d'œuvre, dossiers allégés, congés,
prestataires, facturation et moyens de paiement arrêtés.

Aucune décision en attente ne bloque M0, M1 ni M2. Les sept restantes
concernent l'exploitation ou des modules ultérieurs.

---

## I — Index par module

Quelles décisions du registre s'appliquent à quel module. Le registre classe
par **nature** ; cet index permet la lecture par **module**.

### Transverses — s'appliquent partout

| Décision | Objet |
| --- | --- |
| B-01 · B-02 | N+1 direct puis service compétent, un seul niveau |
| B-05 | Auto-approbation interdite en dur |
| B-06 | Relances par courriel selon l'urgence — 24 h · 3 j · 5 j |
| B-09 | `superieurId` obligatoire sauf pour le DG |
| D-02 · D-07 · D-08 | Authentification, verrouillage 20 min, TOTP |
| D-09 | Tâches planifiées — Vercel Cron |
| E-01 | Pagination serveur, curseur pour le journal |
| E-02 · R-05 | Modale à onglets pour modifier, étapes pour créer |
| E-03 | Brouillons automatiques, 2 s après la frappe |
| E-04 à E-06 | Notifications à trois niveaux |
| R-01 à R-07 | Règles d'interface — `PATRONS.md` |

### M0 — Socle

C-01 à C-04 · D-02 · D-07 · D-08 · E-01

**C-04** — les trois garde-fous de l'administration des accès.

### M1 — Organisation

A-01 à A-10 · **A-08 bis**

**A-08 bis** est la plus structurante : deux chaînes distinctes,
hiérarchique et fonctionnelle. Le code ne doit jamais les confondre.

### M2 — Employés

A-11 à A-14 · C-01 · E-03

**A-12** — dossier allégé du journalier, quatre éléments.
**A-13** — un journalier n'ouvre aucun compteur de congés.

### M3 — Congés

B-01 · B-02 · **B-03** · B-04 · **B-07** · B-09 · A-13

**B-03** — délégation nommée à l'avance.
**B-07** — le refus hiérarchique est **définitif**.

### M4 — Rémunération

D-06 · A-14

Le verrou : une dérogation en attente exclut des exports de paie.

### M5 — Projets

**A-08 bis** · B-08

La chaîne fonctionnelle naît ici, par `AffectationChantier`.

### M6 — Relevés d'activité

**E-07** · A-13 · A-08 bis

**E-07** — tablette, pointage par exception, saisie locale d'abord. Trois
contraintes contre le risque d'abandon.

### M7 — Paie chantier

**B-05** · A-13 · A-14 · D-06

**B-05** — auto-approbation interdite, en dur.

### M8 — Ressources

B-01 · B-02 · **B-08 bis**

**M8 porte l'écran du demandeur**, dans le groupe Technique. M13 porte
l'écran de celui qui arbitre.

Une seule table `DemandeRessource`, deux écrans. Ne pas la dupliquer.

Voir `M13-LOGISTIQUE.md` § 6.0 et 6.1.

### M9 — Appels d'offres

B-04 — les demandes du DG sont auto-approuvées à l'étape hiérarchique.

### M10 — Pilotage

E-04 à E-06 · **E-09** · B-06

**E-09** — accès mobile du DG : recevoir et valider, rien d'autre.

### M11 — Administration

E-01 · C-02

### M12 — Présences bureau

**E-08** — deux dispositifs de pointage, sans recouvrement.

### M13 — Logistique et Parc

A-08 bis · B-01 · B-02 · E-01 · R-01 à R-07

Trois points propres au module, tous inscrits dans `M13-LOGISTIQUE.md` :

**Codification** — trois champs de code, tous uniques et recherchables. Le
code est saisissable à la reprise, généré à la création. § 1.1.

**Les référentiels remplacent les enums** — types de pièce administrative et
points d'inspection se créent depuis l'écran, sans migration. § 7.1 et 7.4.

**M8 reste dans Technique** — le demandeur y est, M13 arbitre. Une seule
table, deux écrans. Voir B-08 bis.

### M14 — Achats

**D-10** · **D-11** · **D-12** · B-01 · B-02

**D-10** — le refus d'un achat n'est **pas** définitif, contrairement à B-07.
**D-12** — pas de contrôle budgétaire dans cette version.

### M15 — ItaPay

**D-13** · **D-14** · **D-15** · A-12 · E-09

**D-13** — autorisation par TOTP dans l'application, jamais par code transmis.
**D-14** — fenêtre de 2 h, créneau 8 h – 14 h, lundi au vendredi.
**D-15** — préparer, autoriser, exécuter : trois gestes, deux personnes.

> ⚠️ **`SECURITE-M15.md` est le complément obligatoire** de ces trois
> décisions. Huit interdits en dur, douze points de contrôle avant
> exploitation.

---

## J — Documents de référence

| Document | Objet |
| --- | --- |
| `DECISIONS.md` | **Ce registre — fait foi en cas de contradiction** |
| `SECURITE.md` | Politique de sécurité, trois exigences bloquantes |
| **`SECURITE-M15.md`** | **Paiements — huit interdits en dur** |
| `PATRONS.md` | Patrons et règles R-01 à R-07 |
| `TYPOGRAPHIE.md` | Police, échelle, graisses, couleurs, icônes |
| `CHAMPS.md` | États des champs, autocomplétation, modales |
| `GUIDE-ENVIRONNEMENTS.md` | Branches, base, déploiement |
| `CLAUDE.md` | Instructions permanentes, quinze règles d'exécution |

### Dossiers de module

`M0-SOCLE.md` · `M1-ORGANISATION.md` · `M2-EMPLOYES.md` · `M3-CONGES.md` ·
`M4-REMUNERATION.md` · `M5-PROJETS.md` · `M6-RELEVES.md` ·
`M7-PAIE-CHANTIER.md` · `M8-M12-DOSSIERS.md` · `M13-LOGISTIQUE.md` ·
`M14-ACHATS.md` · `M15-ITAPAY.md`
