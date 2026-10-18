/*
  Warnings:

  - Made the column `libelleNormalise` on table `familles_materiel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `familles_materiel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `materiel` required. This step will fail if there are existing NULL values in that column.
  - Changed lieuBaseId to nullable on table `materiel` for data import

*/
-- DropForeignKey
ALTER TABLE "materiel" DROP CONSTRAINT "materiel_lieuBaseId_fkey";

-- AlterTable familles_materiel
ALTER TABLE "familles_materiel" RENAME CONSTRAINT "categories_materiel_pkey" TO "familles_materiel_pkey";

ALTER TABLE "familles_materiel"
ALTER COLUMN "libelleNormalise" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "modifieLe" DROP DEFAULT;

-- AlterTable materiel
ALTER TABLE "materiel"
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "lieuBaseId" DROP NOT NULL;

-- AddForeignKey with nullable lieuBaseId
ALTER TABLE "materiel" ADD CONSTRAINT "materiel_lieuBaseId_fkey" FOREIGN KEY ("lieuBaseId") REFERENCES "lieux_stockage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "categories_materiel_code_key" RENAME TO "familles_materiel_code_key";
