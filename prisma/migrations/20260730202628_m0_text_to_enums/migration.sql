/*
  Warnings:

  - The `statut` column on the `grilles_salariales` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `statut` column on the `jalons` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `statut` column on the `projets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `cyclePaie` column on the `projets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `roleFonctionnel` on the `affectations_chantier` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `niveau` on the `echelons_grille` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `typeValidateur` on the `jalons` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "StatutGrille" AS ENUM ('BROUILLON', 'PUBLIEE', 'ARCHIVEE');

-- CreateEnum
CREATE TYPE "StatutProjet" AS ENUM ('BROUILLON', 'OUVERT', 'EN_COURS', 'SUSPENDU', 'CLOTURE');

-- CreateEnum
CREATE TYPE "CyclePaie" AS ENUM ('HEBDOMADAIRE', 'QUINZAINE', 'MENSUEL');

-- CreateEnum
CREATE TYPE "TypeValidateur" AS ENUM ('INTERNE', 'MAITRE_OEUVRE', 'MAITRE_OUVRAGE');

-- CreateEnum
CREATE TYPE "StatutJalon" AS ENUM ('ATTENTE', 'VALIDE', 'ABANDONNE');

-- CreateEnum
CREATE TYPE "RoleFonctionnel" AS ENUM ('CONDUCTEUR', 'CHEF_CHANTIER', 'CHEF_EQUIPE', 'OPERATEUR');

-- AlterTable
ALTER TABLE "affectations_chantier" DROP COLUMN "roleFonctionnel",
ADD COLUMN     "roleFonctionnel" "RoleFonctionnel" NOT NULL;

-- AlterTable
ALTER TABLE "echelons_grille" DROP COLUMN "niveau",
ADD COLUMN     "niveau" "NiveauHierarchique" NOT NULL;

-- AlterTable
ALTER TABLE "grilles_salariales" DROP COLUMN "statut",
ADD COLUMN     "statut" "StatutGrille" NOT NULL DEFAULT 'BROUILLON';

-- AlterTable
ALTER TABLE "jalons" DROP COLUMN "typeValidateur",
ADD COLUMN     "typeValidateur" "TypeValidateur" NOT NULL,
DROP COLUMN "statut",
ADD COLUMN     "statut" "StatutJalon" NOT NULL DEFAULT 'ATTENTE';

-- AlterTable
ALTER TABLE "projets" DROP COLUMN "statut",
ADD COLUMN     "statut" "StatutProjet" NOT NULL DEFAULT 'BROUILLON',
DROP COLUMN "cyclePaie",
ADD COLUMN     "cyclePaie" "CyclePaie";

-- CreateIndex
CREATE UNIQUE INDEX "echelons_grille_grilleId_niveau_key" ON "echelons_grille"("grilleId", "niveau");
