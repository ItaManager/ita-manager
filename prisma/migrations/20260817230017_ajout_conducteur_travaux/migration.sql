-- AlterTable
ALTER TABLE "projets" ADD COLUMN     "conducteurId" TEXT;

-- AddForeignKey
ALTER TABLE "projets" ADD CONSTRAINT "projets_conducteurId_fkey" FOREIGN KEY ("conducteurId") REFERENCES "employes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
