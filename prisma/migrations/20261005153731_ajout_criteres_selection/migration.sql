/*
  Warnings:

  - The `criteres` column on the `lignes_achat` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "lignes_achat" DROP COLUMN "criteres",
ADD COLUMN     "criteres" JSONB;

-- CreateTable
CREATE TABLE "criteres_selection" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creePar" TEXT NOT NULL,
    "creeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "criteres_selection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "criteres_selection_libelle_key" ON "criteres_selection"("libelle");
