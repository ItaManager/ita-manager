-- AlterTable
ALTER TABLE "postes" ADD COLUMN     "superieurPosteId" TEXT;

-- AddForeignKey
ALTER TABLE "postes" ADD CONSTRAINT "postes_superieurPosteId_fkey" FOREIGN KEY ("superieurPosteId") REFERENCES "postes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
