-- AlterTable
ALTER TABLE "taches" ADD COLUMN     "responsableId" TEXT;

-- CreateTable
CREATE TABLE "affectations_taches" (
    "id" TEXT NOT NULL,
    "tacheId" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affectations_taches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affectations_taches_tacheId_employeId_key" ON "affectations_taches"("tacheId", "employeId");

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "employes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations_taches" ADD CONSTRAINT "affectations_taches_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "taches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations_taches" ADD CONSTRAINT "affectations_taches_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
