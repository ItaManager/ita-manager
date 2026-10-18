-- CreateEnum
CREATE TYPE "TypeCarburant" AS ENUM ('GASOIL', 'SUPER', 'MELANGE');

-- CreateEnum
CREATE TYPE "NatureDistribution" AS ENUM ('STATION', 'CUVE');

-- AlterEnum
ALTER TYPE "SourceReleve" ADD VALUE 'CARBURANT';

-- CreateTable
CREATE TABLE "distributions_carburant" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "demandeurId" TEXT NOT NULL,
    "materielId" TEXT NOT NULL,
    "typeCarburant" "TypeCarburant" NOT NULL,
    "quantite" DECIMAL(10,2) NOT NULL,
    "montant" DECIMAL(12,0),
    "compteur" DECIMAL(10,2) NOT NULL,
    "uniteCompteur" "UniteCompteur" NOT NULL,
    "pleinComplet" BOOLEAN NOT NULL DEFAULT true,
    "compteurAnomalie" BOOLEAN NOT NULL DEFAULT false,
    "motifAnomalie" TEXT,
    "nature" "NatureDistribution" NOT NULL,
    "stationId" TEXT,
    "lieuStockageId" TEXT,
    "mouvementStockId" TEXT,
    "serviParId" UUID NOT NULL,
    "dateDistribution" DATE NOT NULL,
    "releveCompteurId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distributions_carburant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations_service" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "libelleNormalise" TEXT NOT NULL,
    "localisation" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stations_service_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "distributions_carburant_reference_key" ON "distributions_carburant"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "distributions_carburant_mouvementStockId_key" ON "distributions_carburant"("mouvementStockId");

-- CreateIndex
CREATE UNIQUE INDEX "distributions_carburant_releveCompteurId_key" ON "distributions_carburant"("releveCompteurId");

-- CreateIndex
CREATE INDEX "distributions_carburant_materielId_dateDistribution_idx" ON "distributions_carburant"("materielId", "dateDistribution");

-- CreateIndex
CREATE INDEX "distributions_carburant_demandeurId_idx" ON "distributions_carburant"("demandeurId");

-- CreateIndex
CREATE INDEX "distributions_carburant_stationId_idx" ON "distributions_carburant"("stationId");

-- CreateIndex
CREATE INDEX "distributions_carburant_lieuStockageId_idx" ON "distributions_carburant"("lieuStockageId");

-- CreateIndex
CREATE UNIQUE INDEX "stations_service_libelle_key" ON "stations_service"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "stations_service_libelleNormalise_key" ON "stations_service"("libelleNormalise");

-- AddForeignKey
ALTER TABLE "distributions_carburant" ADD CONSTRAINT "distributions_carburant_demandeurId_fkey" FOREIGN KEY ("demandeurId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributions_carburant" ADD CONSTRAINT "distributions_carburant_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "materiel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributions_carburant" ADD CONSTRAINT "distributions_carburant_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations_service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributions_carburant" ADD CONSTRAINT "distributions_carburant_lieuStockageId_fkey" FOREIGN KEY ("lieuStockageId") REFERENCES "lieux_stockage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributions_carburant" ADD CONSTRAINT "distributions_carburant_mouvementStockId_fkey" FOREIGN KEY ("mouvementStockId") REFERENCES "mouvements_stock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributions_carburant" ADD CONSTRAINT "distributions_carburant_releveCompteurId_fkey" FOREIGN KEY ("releveCompteurId") REFERENCES "releves_compteur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
