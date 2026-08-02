-- CreateEnum
CREATE TYPE "MotifVisite" AS ENUM ('RENDEZ_VOUS', 'LIVRAISON', 'ENTRETIEN', 'AUTRE');

-- CreateEnum
CREATE TYPE "SensCourrier" AS ENUM ('ARRIVEE', 'DEPART');

-- CreateEnum
CREATE TYPE "StatutTraitement" AS ENUM ('A_TRAITER', 'TRAITE', 'SANS_SUITE');

-- CreateTable
CREATE TABLE "visites" (
    "id" TEXT NOT NULL,
    "nomVisiteur" TEXT NOT NULL,
    "societe" TEXT,
    "telephone" TEXT,
    "visiteId" TEXT NOT NULL,
    "motif" "MotifVisite" NOT NULL,
    "pieceDeposee" BOOLEAN NOT NULL DEFAULT false,
    "arriveeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sortieLe" TIMESTAMP(3),
    "saisieParId" UUID NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courriers" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "sens" "SensCourrier" NOT NULL,
    "dateCorrespondance" DATE NOT NULL,
    "datePassage" DATE NOT NULL,
    "tiers" TEXT NOT NULL,
    "referenceTiers" TEXT,
    "objet" TEXT NOT NULL,
    "serviceId" TEXT,
    "directionId" TEXT,
    "fichierId" TEXT,
    "statutTraitement" "StatutTraitement" NOT NULL DEFAULT 'A_TRAITER',
    "traiteLe" TIMESTAMP(3),
    "traiteParId" UUID,
    "commentaireTraitement" TEXT,
    "saisieParId" UUID NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courriers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visites_arriveeLe_idx" ON "visites"("arriveeLe");

-- CreateIndex
CREATE INDEX "visites_sortieLe_idx" ON "visites"("sortieLe");

-- CreateIndex
CREATE INDEX "visites_visiteId_idx" ON "visites"("visiteId");

-- CreateIndex
CREATE UNIQUE INDEX "courriers_numero_key" ON "courriers"("numero");

-- CreateIndex
CREATE INDEX "courriers_sens_datePassage_idx" ON "courriers"("sens", "datePassage");

-- CreateIndex
CREATE INDEX "courriers_referenceTiers_idx" ON "courriers"("referenceTiers");

-- CreateIndex
CREATE INDEX "courriers_statutTraitement_idx" ON "courriers"("statutTraitement");

-- CreateIndex
CREATE INDEX "courriers_serviceId_idx" ON "courriers"("serviceId");

-- CreateIndex
CREATE INDEX "courriers_directionId_idx" ON "courriers"("directionId");

-- AddForeignKey
ALTER TABLE "visites" ADD CONSTRAINT "visites_visiteId_fkey" FOREIGN KEY ("visiteId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visites" ADD CONSTRAINT "visites_saisieParId_fkey" FOREIGN KEY ("saisieParId") REFERENCES "profils"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courriers" ADD CONSTRAINT "courriers_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courriers" ADD CONSTRAINT "courriers_directionId_fkey" FOREIGN KEY ("directionId") REFERENCES "directions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courriers" ADD CONSTRAINT "courriers_traiteParId_fkey" FOREIGN KEY ("traiteParId") REFERENCES "profils"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courriers" ADD CONSTRAINT "courriers_saisieParId_fkey" FOREIGN KEY ("saisieParId") REFERENCES "profils"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
