-- AlterTable
ALTER TABLE "employes" ADD COLUMN     "competenceId" TEXT;

-- CreateTable
CREATE TABLE "competences" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "tauxJournalier" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,
    "archiveLe" TIMESTAMP(3),

    CONSTRAINT "competences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "competences_code_key" ON "competences"("code");

-- CreateIndex
CREATE UNIQUE INDEX "competences_libelle_key" ON "competences"("libelle");

-- CreateIndex
CREATE INDEX "employes_competenceId_idx" ON "employes"("competenceId");

-- AddForeignKey
ALTER TABLE "employes" ADD CONSTRAINT "employes_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "competences"("id") ON DELETE SET NULL ON UPDATE CASCADE;
