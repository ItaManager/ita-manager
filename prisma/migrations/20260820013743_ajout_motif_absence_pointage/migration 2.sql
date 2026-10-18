-- CreateEnum
CREATE TYPE "MotifAbsence" AS ENUM ('MALADIE', 'PERMISSION', 'INTEMPERIE', 'ABSENT_SANS_MOTIF', 'AUTRE');

-- AlterTable
ALTER TABLE "pointages" ADD COLUMN     "motifAbsence" "MotifAbsence";
