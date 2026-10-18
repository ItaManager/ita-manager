-- CreateEnum
CREATE TYPE "StatutReleve" AS ENUM ('BROUILLON', 'SOUMIS', 'VISE', 'REFUSE');

-- CreateEnum
CREATE TYPE "EtatPointage" AS ENUM ('PRESENT', 'ABSENT_JUSTIFIE', 'ABSENT_NON_JUSTIFIE', 'RETARD', 'REPOS');

-- CreateTable
CREATE TABLE "releves_activite" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "projetId" TEXT NOT NULL,
    "chefChantierId" TEXT NOT NULL,
    "statut" "StatutReleve" NOT NULL DEFAULT 'BROUILLON',
    "motifRefus" TEXT,
    "conducteurId" UUID,
    "viseLe" TIMESTAMP(3),
    "derniereSyncLocale" TIMESTAMP(3),
    "derniereSync" TIMESTAMP(3),
    "syncEnAttente" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "releves_activite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pointages" (
    "id" TEXT NOT NULL,
    "releveId" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "etat" "EtatPointage" NOT NULL DEFAULT 'PRESENT',
    "heuresTheoretiques" DECIMAL(5,2) NOT NULL,
    "heuresReelles" DECIMAL(5,2) NOT NULL,
    "heuresSup" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "observation" TEXT,

    CONSTRAINT "pointages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travaux_realises" (
    "id" TEXT NOT NULL,
    "releveId" TEXT NOT NULL,
    "tacheId" TEXT,
    "description" TEXT NOT NULL,
    "avancementDeclare" DECIMAL(5,2),
    "observation" TEXT,

    CONSTRAINT "travaux_realises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisations_materiel" (
    "id" TEXT NOT NULL,
    "releveId" TEXT NOT NULL,
    "materielDescription" TEXT NOT NULL,
    "heuresFonctionnement" DECIMAL(6,2),
    "carburant" DECIMAL(8,2),
    "observation" TEXT,

    CONSTRAINT "utilisations_materiel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consommations_materiaux" (
    "id" TEXT NOT NULL,
    "releveId" TEXT NOT NULL,
    "articleDescription" TEXT NOT NULL,
    "quantite" DECIMAL(10,3) NOT NULL,
    "unite" TEXT NOT NULL,
    "observation" TEXT,

    CONSTRAINT "consommations_materiaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "releveId" TEXT NOT NULL,
    "nature" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pieceId" TEXT,
    "contientBlessure" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "releves_activite_chefChantierId_idx" ON "releves_activite"("chefChantierId");

-- CreateIndex
CREATE INDEX "releves_activite_statut_idx" ON "releves_activite"("statut");

-- CreateIndex
CREATE INDEX "releves_activite_date_idx" ON "releves_activite"("date");

-- CreateIndex
CREATE UNIQUE INDEX "releves_activite_projetId_date_key" ON "releves_activite"("projetId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "pointages_releveId_employeId_key" ON "pointages"("releveId", "employeId");

-- AddForeignKey
ALTER TABLE "releves_activite" ADD CONSTRAINT "releves_activite_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releves_activite" ADD CONSTRAINT "releves_activite_chefChantierId_fkey" FOREIGN KEY ("chefChantierId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pointages" ADD CONSTRAINT "pointages_releveId_fkey" FOREIGN KEY ("releveId") REFERENCES "releves_activite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pointages" ADD CONSTRAINT "pointages_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travaux_realises" ADD CONSTRAINT "travaux_realises_releveId_fkey" FOREIGN KEY ("releveId") REFERENCES "releves_activite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travaux_realises" ADD CONSTRAINT "travaux_realises_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "taches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilisations_materiel" ADD CONSTRAINT "utilisations_materiel_releveId_fkey" FOREIGN KEY ("releveId") REFERENCES "releves_activite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consommations_materiaux" ADD CONSTRAINT "consommations_materiaux_releveId_fkey" FOREIGN KEY ("releveId") REFERENCES "releves_activite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_releveId_fkey" FOREIGN KEY ("releveId") REFERENCES "releves_activite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
