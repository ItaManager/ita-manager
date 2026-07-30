# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [v0.3.0] - 2026-07-30

### Module M2 — Employés

Gestion complète des employés : création, modification, archivage, contrats, documents.

#### Ajouté

- **Création employés** : modale 6 étapes (permanent/journalier) avec patron ModaleEtapes
- **Liste employés** : filtres (type, direction, service, dossier), pagination serveur (25 lignes)
- **Fiche détail** : 4 onglets (profil/contrats/documents/historique)
- **Modification** : modale 3 onglets (identité/contact/admin)
- **Archivage** : avec motif, clôture affectations, désactivation compte
- **Écrans globaux** :
  - `/contrats` : alertes échéances CDD (30j danger, 60j warning)
  - `/documents` : dossiers incomplets avec taux de complétude
  - `/remuneration/derogations` : circuit validation DFC
- **10 nationalités** référentielles
- **7 permissions** M2 : `employe:*`, `contrat:*`, `derogation:*`
- **Patron ModaleEtapes** : composant réutilisable (PATRONS.md § 4 bis)
- **Script verify-m2** : nationalités, permissions, rôles (68 critères)

#### Règles métier

- 2 dossiers distincts (permanent 40 champs, journalier 4 champs)
- Cascade affectation direction→service→poste
- `superieurId` obligatoire sauf DG (décision B-09)
- Matricule généré `ITA-AAAA-NNNN`
- Complétude dossier (7 pièces permanent, 2 journalier)
- Alertes CDD à 60j et 30j d'échéance
- Dérogations salariales avec circuit validation DFC
- Archivage sans suppression (conservation 5 ans)

#### Technique

- Build production : 37 routes
- TypeScript strict : 0 erreur
- Base Prisma : 8 nouveaux modèles M2
- Auto-save drafts (E-03) : 2s après frappe
- Form validation : react-hook-form + zod

#### Commits principaux

- `0c015ec` : patron ModaleEtapes + corrections TypeScript
- `4f6af17` : modification et archivage employés
- `16fbf04` : écrans globaux — contrats, documents, dérogations

---

## [v0.2.0] - 2026-07-29

### Module M1 — Organisation

Structure organisationnelle complète : directions, services, postes.

#### Ajouté

- **4 directions** : DG, DFC, DT, DAR
- **8 services** avec hiérarchie
- **30 postes** avec chaîne hiérarchique
- **CRUD services** : création, modification, désactivation
- **CRUD postes** : création, modification, désactivation
- **Organigramme visuel** : affichage hiérarchique interactif
- **Écran cohérence** : contrôles validation structure
- **Écran directions** : lecture seule
- **Combobox** avec création inline (règle R-04)
- **2 permissions** : `organisation:consulter`, `organisation:modifier`
- **Scripts de vérification** :
  - `verify-db-counts` : 4/8/30/14
  - `verify-hierarchie` : chaîne stricte
  - `verify-m1-grille` : grille complète
  - `verify-all` : orchestration des 4 vérifications

#### Règles métier

- Hiérarchie stricte : Direction → Service → Poste
- Postes de chaîne : attachés direction, pas service
- Chaîne hiérarchique : `superieurPosteId` pour validation
- Pas de suppression : désactivation uniquement
- Nomenclature décision A-06, A-08, A-08 bis

#### Technique

- Build production : 38 routes
- TypeScript strict : 0 erreur
- Migration Prisma : Direction, Service, Poste, NiveauHierarchique
- Seed M1 : données initiales organisationnelles

#### Commits principaux

- `d40744e` : db(m1) migration et seed Organisation
- `8b128c3` : interfaces CRUD organisation
- `e358b86` : fix hiérarchie corrigée (DECISIONS.md)
- `529161b` : script verify-all — chaîne les 4 vérifications

---

## [v0.1.0] - 2026-07-28

### Module M0 — Socle

Authentification, 2FA TOTP, verrouillage de session, permissions par rôle, journal d'audit.

#### Ajouté

- **Authentification Supabase** : connexion, déconnexion, mot de passe oublié
- **2FA TOTP** :
  - Inscription avec QR code (généré client-side avec `qrcode.react`)
  - 10 codes de secours avec copie et impression
  - Validation numérique stricte (6 chiffres)
  - Écran dédié codes de secours
- **Verrouillage session** : après 20 min d'inactivité (déverrouillage par mot de passe)
- **9 rôles** : ADMIN, DG, DRH, RH, DFC, DT, CT, CC, CE
- **31 permissions** : 5 domaines (RH, PAIE, TECHNIQUE, REFERENTIEL, ADMIN)
- **Journal d'audit** : append-only, conservation 5 ans
- **Pages admin** :
  - `/admin/utilisateurs` : gestion comptes
  - `/admin/journal` : consultation audit
  - `/403` : accès refusé
- **Indicateur force mot de passe** : 4 segments
- **Bouton œil** : toggle visibilité mot de passe
- **Bloc identité TOTP** : affichage email utilisateur

#### Règles métier

- TOTP obligatoire pour : ADMIN, DG, DRH, DFC, DT
- Verrouillage automatique : 20 min inactivité
- 3 garde-fous admin :
  - Impossible retirer rôle ADMIN du dernier admin
  - Impossible désactiver son propre compte
  - Impossible retirer son propre rôle ADMIN
- Mot de passe : minimum 12 caractères, vérification HIBP
- Aucune donnée sensible journalisée (RIB, CNPS exclus)

#### Technique

- Build production : 21 routes
- TypeScript strict : 0 erreur
- Next.js 16.2.12 (App Router, Turbopack)
- React 19
- Tailwind v4 avec thème ITA officiel
- Prisma + Supabase PostgreSQL
- Trigger : création `profils` auto depuis `auth.users`
- Seed : catalogue permissions, rôles, Super Admin

#### Commits principaux

- `2cc0d6d` : amorçage Next.js/Tailwind v4/shadcn
- `8f70f16` : base Prisma + Supabase — schéma M0
- `afd6311` : seed — catalogue permissions, rôles
- `466486e` : authentification — connexion, TOTP, verrouillage
- `434a4c1` : génération QR TOTP côté client
- `e449017` : écran dédié codes de secours TOTP
- `c563192` : finitions visuelles — bloc identité, jauge MDP, bouton œil

---

## [Unreleased]

### En cours

- M11 (Administration) : paramètres, journal, aide

### Planifié

- M3 (Congés) : compteurs, circuits validation
- M4 (Rémunération) : grille, dérogations
- M5 (Projets) : gestion projets
- M6 (Rapports d'activité) : saisie chantier
- M7 (Paie) : bulletins, virements
- M8 (Ressources) : matériel, véhicules
- M9 (Appels d'offres) : soumissions
- M10 (Tableaux de bord) : indicateurs
- M12 (Présences bureau) : pointage

---

[v0.3.0]: https://github.com/ITA-SARL/ita-manager/compare/v0.2.0...v0.3.0
[v0.2.0]: https://github.com/ITA-SARL/ita-manager/compare/v0.1.0...v0.2.0
[v0.1.0]: https://github.com/ITA-SARL/ita-manager/releases/tag/v0.1.0
