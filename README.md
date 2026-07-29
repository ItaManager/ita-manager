# ITA Manager

ERP interne d'ITA SARL, entreprise de BTP en Côte d'Ivoire. Reconstruction
complète à partir de zéro — l'application précédente (ITA Digital) est
abandonnée.

Documents de référence, à lire dans cet ordre : `DECISIONS.md` (fait foi en
cas de contradiction), `SECURITE.md`, `PATRONS.md`, `M0-SOCLE.md`,
`GUIDE-ENVIRONNEMENTS.md`, `docs/schema-cible.prisma` (schéma cible complet
du produit final — le schéma réellement migré module par module vit dans
`prisma/schema.prisma` une fois le socle amorcé).

Module en cours : **M0 — Socle** (authentification, modèle rôle/permission,
mise en page générique, déploiement — aucun écran métier).

Ce dépôt utilise deux fichiers d'environnement locaux, jamais interchangeables :

| Fichier | Contenu | Base associée |
| --- | --- | --- |
| `.env.dev` | Développement | `ita-manager-dev` |
| `.env.local` | Production | `ita-manager` |

Voir `GUIDE-ENVIRONNEMENTS.md` pour le détail des scripts (`pnpm dev`,
`pnpm db:migrate:dev`, etc.) qui ciblent explicitement `.env.dev`.
