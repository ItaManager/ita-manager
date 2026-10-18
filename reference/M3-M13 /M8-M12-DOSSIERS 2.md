# M8 à M12 — Dossiers de module

Cinq modules, du plus lourd au plus léger. Chacun avec ses décisions
bloquantes en tête.

---
---

# M8 — Ressources et matériel

**Prérequis** : M5 · **Version** : `v0.9.0`

## 1. Décisions bloquantes

### 1.1 · L'incohérence B-08 — **à trancher en priorité**

La décision B-08 dirige les demandes de ressources logistiques vers le
**Chef du Garage**. Elle a été écrite **avant** la création du poste de
**Chef de Service Logistique** en A-06.

Aujourd'hui, le Chef du Garage n'est plus le responsable du service : il
encadre l'équipe technique sous l'autorité du Chef de Service.

**Recommandation** : la demande remonte au **Chef de Service Logistique**,
qui arbitre l'affectation du parc. Le Chef du Garage exécute la mise à
disposition.

**Laissé tel quel, le routage sera faux.**

### 1.2 · Affectation simultanée — **à trancher**

Un engin peut-il être affecté à deux chantiers en même temps ? Un camion qui
fait la navette, oui. Une pelle mécanique, non.

**Recommandation** : un indicateur `partageable` sur la fiche matériel.

### 1.3 · Entretien et carburant — **périmètre à fixer**

Restent-ils hors de M8, pour un module ultérieur ? La note M13 les prévoit.

**Recommandation** : hors périmètre. M8 gère l'affectation et la disponibilité.
M6 enregistre déjà les heures de fonctionnement et le carburant consommé —
c'est suffisant pour analyser plus tard.

## 2. Objectif

Savoir quel matériel existe, où il est, qui l'a demandé, et arbitrer les
demandes concurrentes.

## 3. Écrans

| Écran | Route | Permission |
| --- | --- | --- |
| Parc matériel | `/ressources/materiel` | `ressource:demander` |
| Fiche matériel | `/ressources/materiel/[id]` | `ressource:demander` |
| Demandes | `/ressources/demandes` | `ressource:demander` |
| À arbitrer | `/ressources/arbitrage` | selon le service compétent |
| Planning du parc | `/ressources/planning` | `ressource:demander` |

Le **planning du parc** est l'écran qui compte : une ligne par engin, une
colonne par semaine. On y voit les conflits d'affectation d'un coup d'œil.

## 4. Modèle

`Materiel` · `CategorieMateriel` · `AffectationMateriel` ·
`DemandeRessource` · `LigneDemandeRessource`

Une `DemandeRessource` porte deux natures : **humaine** — j'ai besoin de trois
maçons la semaine 34 — ou **matérielle** — j'ai besoin d'une bétonnière.

Le circuit diffère : la première va à la Direction RH, la seconde au Service
Logistique.

## 5. Règles métier

**Le circuit suit B-01** : supérieur hiérarchique d'abord pour l'opportunité,
service compétent ensuite pour la faisabilité.

**Une demande matérielle vérifie la disponibilité** à l'arbitrage. Si l'engin
est déjà affecté, le conflit est affiché avec le chantier concurrent — c'est
au Chef de Service Logistique d'arbitrer, pas au système.

**Un matériel en panne** ne peut pas être affecté. L'état se saisit
manuellement en M8 ; l'entretien viendra plus tard.

**L'affectation a des dates.** Sans elles, le planning du parc n'existe pas.

## 6. Critères de recette

- [ ] Créer un matériel avec sa catégorie
- [ ] L'affecter à un chantier sur une période
- [ ] **Une affectation concurrente sur un matériel non partageable est signalée**
- [ ] Un matériel en panne ne peut pas être affecté
- [ ] Une demande humaine part à la Direction RH
- [ ] **Une demande matérielle part au Chef de Service Logistique** — voir 1.1
- [ ] Le planning du parc affiche les conflits
- [ ] `viserDemande` appelée sans permission, par POST direct, est refusée
- [ ] `npm run build` passe, `verify-m8.ts` écrit et vu échouer

---
---

# M9 — Appels d'offres

**Prérequis** : M1 · **Version** : `v0.10.0`

## 1. Décisions bloquantes

### 1.1 · Un marché remporté crée-t-il un projet ? — **à trancher**

**Recommandation** : oui, avec confirmation. Le Directeur Technique valide la
création et complète les informations manquantes. Ressaisir un chantier déjà
décrit dans le dossier d'offre serait absurde.

### 1.2 · Liste type de pièces — **à fournir**

Les pièces d'un dossier d'appel d'offres varient selon le type de marché —
public, privé, international. Existe-t-il des listes types chez ITA ?

Sans elles, le dépôt de pièces reste libre, et le suivi de complétude
impossible.

### 1.3 · Suivi des concurrents — **à trancher**

Faut-il enregistrer les concurrents et leurs prix de sortie, pour analyser
les échecs ?

C'est utile mais sensible. **Recommandation** : oui, en champ libre, sans
prétention d'exhaustivité.

## 2. Objectif

Suivre la veille, la décision de participer, la constitution du dossier, la
soumission et le résultat.

**Le point de contrôle est le go/no-go du Directeur Général.** Il évite de
mobiliser le bureau d'études sur un marché qu'ITA ne remportera pas.

## 3. Circuit

```
VEILLE → GO/NO-GO (DG) → CONSTITUTION → SOUMIS → RÉSULTAT
                ↓
             ABANDONNÉ
```

## 4. Écrans

| Écran | Route | Permission | Forme |
| --- | --- | --- | --- |
| Liste | `/appels-offres` | `ao:creer` | 3 |
| Dossier | `/appels-offres/[id]` | `ao:creer` | **page dédiée** — E-02 |
| Go/No-go | modale | `ao:validerDG` | 8 |
| Tableau de bord | `/appels-offres/pilotage` | `ao:creer` | — |

Le **tableau de bord** répond à trois questions : combien de dossiers en
cours, quel taux de réussite, quel montant cumulé soumissionné.

## 5. Modèle

`AppelOffres` · `PieceAO` · `DecisionAO` · `Concurrent`

`AppelOffres` porte : référence, maître d'ouvrage, objet, montant estimé,
date limite de dépôt, lieu, type de marché.

## 6. Règles métier

**La date limite est le pivot.** Une alerte à J−15 et J−7 pour les dossiers
non soumis. Un dossier dépassé sans soumission passe en `ABANDONNE`
automatiquement, avec mention.

**Le go/no-go exige un motif** dans les deux sens. Un no-go motivé nourrit la
veille : « montant trop faible », « hors compétence », « délai intenable ».

**Un dossier soumis est figé.** Les pièces ne se modifient plus. C'est ce qui
a été déposé.

**Le résultat porte le montant d'attribution**, s'il est connu, et le nom de
l'attributaire s'il s'agit d'un concurrent.

## 7. Critères de recette

- [ ] Créer un appel d'offres en veille
- [ ] **Le go/no-go exige un motif dans les deux sens**
- [ ] Un no-go clôt le dossier
- [ ] Une alerte apparaît à J−15 et J−7
- [ ] Un dossier dépassé passe en abandonné automatiquement
- [ ] **Un dossier soumis n'accepte plus de modification de pièce**
- [ ] Un marché remporté propose la création d'un projet
- [ ] Le tableau de bord affiche le taux de réussite
- [ ] `ao:validerDG` est exigée pour le go/no-go, contrôlée par POST direct
- [ ] `npm run build` passe, `verify-m9.ts` écrit et vu échouer

---
---

# M10 — Pilotage

**Prérequis** : tous les modules métier · **Version** : `v0.11.0`

## 1. Décisions bloquantes

### 1.1 · Indicateurs par rôle — **à définir avec chaque direction**

C'est la seule décision réellement bloquante, et elle demande un entretien
avec chaque direction. Proposition de départ :

| Rôle | Indicateurs |
| --- | --- |
| DG | Chiffre soumissionné, taux de réussite AO, masse salariale, chantiers en retard |
| DRH | Effectif, dossiers incomplets, congés en attente, contrats à échéance |
| DFC | Masse salariale, périodes de paie à valider, dérogations en attente |
| DT | Chantiers en cours, avancement moyen, relevés non visés, matériel immobilisé |

### 1.2 · Rapport hebdomadaire par courriel — **à trancher**

Un état chaque lundi matin, par rôle ? Utile, mais devient du bruit s'il
n'est pas lu.

**Recommandation** : oui pour le DG et les directeurs, non pour les autres.
Désactivable individuellement.

## 2. Objectif

Donner à chacun la vue de ce qui le concerne, et faire remonter ce qui attend
une décision.

## 3. Notifications — trois niveaux, décisions E-04 à E-06

| Niveau | Mécanisme | Portée |
| --- | --- | --- |
| Immédiat | Toast | L'action que l'on vient de faire |
| Différé | Compteur serveur, revalidé au retour d'onglet | Ce qui attend |
| **Externe** | **Courriel Resend** | Le seul qui atteint les gens |

Le temps réel Supabase Realtime est **écarté** : la complexité ne se justifie
pas pour un back-office consulté quelques fois par jour.

**Relances par courriel selon l'urgence** — décision B-06 : critique 24 h,
haute 3 jours, normale 5 jours.

## 4. Accès mobile du Directeur Général — décision E-09

**Périmètre strict : recevoir et valider.** Pas de tableaux de bord, pas de
saisie, pas de navigation dans les modules.

| Élément | Choix |
| --- | --- |
| Forme | **Web adaptatif**, pas d'application native |
| Écrans | Liste des éléments en attente · fiche de décision |
| Objets | Go/no-go d'appel d'offres · dérogations · congés relevant de lui |
| Authentification | Identique au bureau, second facteur compris |

**Aucune application native.** Deux magasins, deux cycles de publication et
une maintenance propre ne se justifient pas pour deux boutons.

## 5. Écrans

| Écran | Route | Permission |
| --- | --- | --- |
| Tableau de bord | `/` | connecté — contenu selon le rôle |
| Notifications | `/notifications` | connecté |
| Calendrier RH | `/calendrier` | `employe:lire` |
| Annonces | `/annonces` | connecté |
| Rapports | `/rapports` | selon le rapport |
| Mobile — à valider | `/mobile/decisions` | connecté |

## 6. Règles métier

**Un indicateur qui n'appelle aucune action ne doit pas figurer au tableau de
bord.** « 47 employés » n'appelle rien. « 3 dossiers incomplets » appelle une
action, et doit être cliquable.

**Une notification se marque lue**, et disparaît des compteurs. Elle reste
consultable.

**Une relance ne se répète pas indéfiniment.** Trois relances, puis escalade
au niveau supérieur avec mention.

**Les compteurs se revalident au retour d'onglet**, pas en interrogation
périodique. Décision E-05.

## 7. Critères de recette

- [ ] Le tableau de bord affiche des indicateurs différents selon le rôle
- [ ] Chaque indicateur d'alerte est cliquable et mène à l'écran concerné
- [ ] Un toast apparaît après une action propre
- [ ] Le compteur de notifications se met à jour au retour d'onglet
- [ ] **Un courriel part selon le délai d'urgence** — 24 h, 3 j, 5 j
- [ ] Trois relances sans réponse déclenchent une escalade
- [ ] Marquer lu retire du compteur sans supprimer
- [ ] **L'écran mobile du DG s'affiche correctement à 375 px**
- [ ] Il ne propose que recevoir et valider
- [ ] `npm run build` passe, `verify-m10.ts` écrit et vu échouer

---
---

# M11 — Administration

**Prérequis** : tous · **Version** : `v0.12.0`

## 1. Décisions bloquantes

### 1.1 · Conservation du journal — **à trancher**

Trois ans, cinq ans ? Purge automatique ou archivage froid ?

**Recommandation** : cinq ans en base, archivage annuel des exercices
antérieurs vers un fichier signé, conservé hors application.

### 1.2 · Édition des rôles — **à trancher**

M0 attribue des **rôles entiers**, pas des permissions unitaires. Faut-il un
écran d'édition des rôles ?

**Recommandation : non.** Une attribution à la carte double la surface
d'erreur sans usage réel à cette échelle. Si le besoin apparaît, il fera
l'objet d'un module distinct.

## 2. Objectif

Rassembler les paramètres, rendre le journal exploitable, et fournir une aide
en ligne.

## 3. Écrans

| Écran | Route | Permission |
| --- | --- | --- |
| Paramètres | `/parametres` | `admin:parametres` |
| Journal d'audit | `/journal` | `admin:journal` |
| Aide | `/aide` | connecté |

### 3.1 · Paramètres — regroupés par domaine

| Domaine | Contenu |
| --- | --- |
| Général | Nom de l'entreprise, logo, coordonnées |
| Sécurité | Délai de verrouillage, obligation TOTP par rôle |
| Congés | Dotations, majorations, plafond de report, jours fériés |
| Paie | Diviseur du taux journalier, heures supplémentaires |
| Notifications | Délais de relance par niveau d'urgence |

### 3.2 · Journal d'audit

Filtres : période, auteur, action, entité, résultat. Pagination **par
curseur** — décision E-01.

Export tableur, filtres appliqués, pour une demande d'inspection du travail
ou un contrôle interne.

## 4. Règles métier

**Le journal est en ajout seul.** Aucune action de l'application ne permet de
le modifier ni d'en supprimer une ligne.

**Aucune donnée sensible n'y figure.** Des identifiants, pas des valeurs — ni
salaire, ni numéro CNPS, ni RIB, ni numéro Wave, ni contenu médical.

**Toute modification de paramètre est journalisée**, avec l'ancienne et la
nouvelle valeur.

**Une valeur paramétrable a toujours une valeur par défaut sensée.** Le
système doit fonctionner sans réglage préalable.

**Deux paramètres ne se modifient pas** sans intervention technique : le
format du matricule et les codes de rôle. Les changer casserait des données
existantes.

## 5. Critères de recette

- [ ] Modifier un paramètre est journalisé avec ancienne et nouvelle valeur
- [ ] **Aucune action ne permet de modifier ou supprimer une ligne de journal**
- [ ] La pagination du journal est par curseur, pas par décalage
- [ ] Les filtres du journal fonctionnent et se combinent
- [ ] L'export tableur respecte les filtres appliqués
- [ ] **Aucune valeur sensible n'apparaît dans le journal** — vérification par requête
- [ ] Un rôle sans `admin:parametres` n'accède pas aux paramètres
- [ ] `npm run build` passe, `verify-m11.ts` écrit et vu échouer

---
---

# M12 — Présences bureau

**Prérequis** : M2 · **Version** : `v0.13.0`

> **Le module dont l'absence coûte le moins cher.** Le pointage bureau
> n'alimente aucun calcul : une panne de borne fait perdre un registre, pas
> un salaire. D'où sa place en dernier — décision E-08.

## 1. Décisions bloquantes

### 1.1 · À quoi sert le registre — **à trancher**

Contrôle de présence informel, ou pièce opposable — rapport mensuel, contrôle
de l'inspection du travail ?

La réponse change les exigences de traçabilité et de conservation.

### 1.2 · Correction d'un oubli — **à trancher**

Un employé oublie de pointer. Qui corrige, et sur quelle preuve ?

**Recommandation** : la Direction RH, avec motif obligatoire, correction
journalisée et visible sur le registre.

### 1.3 · Photo à la validation — **à trancher**

Un code à 5 chiffres se communique en trois secondes. Une photo prise à la
validation dissuade le pointage pour autrui.

Mais c'est une donnée biométrique de fait, avec les obligations que cela
implique — déclaration ARTCI, information des employés.

**Recommandation : non.** La présence d'un agent d'accueil suffit, et le
risque reste mesuré puisque le pointage n'a aucun effet sur la paie.

## 2. Deux dispositifs, sans recouvrement

| Dispositif | Population | Lieu | Finalité |
| --- | --- | --- | --- |
| **Relevé d'activité** — M6 | Équipes de chantier | Chantier, tablette | **Paie chantier** |
| **Borne d'accueil** — M12 | Employés du siège | Siège, tablette fixe | **Liste de présence** |

**Aucun agent n'est pointé deux fois.**

## 3. Fonctionnement

L'employé saisit un **code personnel à 5 chiffres**, une fois à l'arrivée,
une fois au départ.

| Élément | Choix |
| --- | --- |
| Identifiant | Code à 5 chiffres, personnel, **distinct du mot de passe applicatif** |
| Portée | Enregistrer une présence. **Aucun accès aux données.** |
| Finalité | Registre — **aucun effet sur la paie** |
| Appareil | Tablette fixe, **authentifiée comme appareil** |

> ⚠️ **La borne doit être authentifiée comme appareil.** Sinon n'importe qui
> ouvre l'URL depuis son téléphone et pointe pour un collègue, de chez lui.
>
> Un jeton d'appareil, généré à l'installation, stocké localement, révocable
> depuis l'administration.

## 4. Écrans

| Écran | Route | Permission |
| --- | --- | --- |
| **Borne** | `/borne` | jeton d'appareil, **hors session utilisateur** |
| Registre | `/presences` | `employe:lire` |
| Codes de pointage | `/administration/codes-pointage` | `admin:utilisateurs` |
| Appareils autorisés | `/administration/bornes` | `admin:parametres` |

### 4.1 · Écran de borne

Un pavé numérique, gros. Rien d'autre.

- Cibles tactiles de **60 px** — plus grandes qu'ailleurs, on tape debout
- Confirmation visible trois secondes : « Bonjour Marc, arrivée enregistrée à 8 h 04 »
- Retour automatique au pavé
- **Aucune donnée personnelle affichée** au-delà du prénom
- Pas de liste d'employés, pas d'autocomplétation — sinon on saurait qui travaille ici

## 5. Modèle

`CodePointage` · `Pointage Bureau` · `AppareilBorne`

Le code est **haché**, jamais stocké en clair. Il se régénère depuis
l'administration ; l'ancien devient invalide.

## 6. Règles métier

**Le code ne donne accès à aucune donnée.** C'est son cloisonnement qui le
rend acceptable avec seulement 5 chiffres.

**Deux pointages par jour au maximum** — arrivée et départ. Un troisième
avertit sans bloquer, et apparaît au registre comme anomalie.

**Un pointage ne se supprime pas.** Une correction ajoute une ligne
rectificative, avec motif et auteur.

**La borne ne se verrouille pas** après inactivité — elle n'expose rien.

**Le registre n'alimente aucun calcul de paie.** Décision E-08. C'est ce qui
autorise un niveau de sécurité modéré.

## 7. Critères de recette

- [ ] Un code valide enregistre une arrivée
- [ ] Le même code enregistre un départ
- [ ] **Un troisième pointage le même jour avertit et apparaît en anomalie**
- [ ] Un code invalide affiche une erreur sans révéler s'il existe
- [ ] **La borne refuse de fonctionner sans jeton d'appareil valide**
- [ ] Révoquer un appareil le bloque immédiatement
- [ ] **Aucune liste d'employés n'est accessible depuis la borne**
- [ ] Le code est haché en base, jamais lisible
- [ ] Régénérer un code invalide l'ancien
- [ ] Une correction ajoute une ligne, ne modifie pas l'existante
- [ ] Le registre s'exporte en tableur
- [ ] `npm run build` passe, `verify-m12.ts` écrit et vu échouer

---
---

# Récapitulatif — décisions bloquantes par module

| Module | Décisions | Nature |
| --- | --- | --- |
| **M3** | 5 | Droit du travail et convention collective |
| **M4** | 3 | Politique salariale — DFC |
| **M5** | 5 | Organisation des chantiers — DT et DG |
| **M6** | 4 | Terrain — DT et chefs de chantier |
| **M7** | 5 | Paie et formats bancaires — DFC |
| **M8** | 3 | Logistique — dont l'incohérence B-08 |
| **M9** | 3 | Commercial — DT et DG |
| **M10** | 2 | Indicateurs — chaque direction |
| **M11** | 2 | Conservation et gouvernance |
| **M12** | 3 | Organisation de l'accueil |

**Trente-cinq décisions.** Aucune n'est technique.

Celles de M3, M4 et M7 sont les plus lourdes : elles touchent au droit du
travail, à la politique salariale et aux formats bancaires. Elles demandent
un entretien avec la DRH et la DFC, pas une réponse en cinq minutes.

Celles de M5, M6, M8 et M9 relèvent de l'organisation interne et peuvent se
trancher plus vite.

**Une seule est urgente et gratuite** : l'incohérence B-08 de M8. Elle est
déjà dans le registre, elle produira un routage faux si personne ne la
tranche.
