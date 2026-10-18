-- CreateEnum
CREATE TYPE "TypePointage" AS ENUM ('ARRIVEE', 'DEPART');

-- CreateTable
CREATE TABLE "appareils_borne" (
    "id" TEXT NOT NULL,
    "jetonHash" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "emplacement" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dernierAcces" TIMESTAMP(3),
    "creePar" UUID NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoqueLe" TIMESTAMP(3),
    "revoquePar" UUID,

    CONSTRAINT "appareils_borne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codes_pointage" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "genereParId" UUID NOT NULL,
    "genereLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codes_pointage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pointages_bureau" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "type" "TypePointage" NOT NULL,
    "horodatage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estCorrection" BOOLEAN NOT NULL DEFAULT false,
    "corrigePar" UUID,
    "motif" TEXT,
    "estAnomalie" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pointages_bureau_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appareils_borne_jetonHash_key" ON "appareils_borne"("jetonHash");

-- CreateIndex
CREATE UNIQUE INDEX "codes_pointage_employeId_key" ON "codes_pointage"("employeId");

-- CreateIndex
CREATE INDEX "codes_pointage_employeId_idx" ON "codes_pointage"("employeId");

-- CreateIndex
CREATE INDEX "pointages_bureau_employeId_idx" ON "pointages_bureau"("employeId");

-- CreateIndex
CREATE INDEX "pointages_bureau_horodatage_idx" ON "pointages_bureau"("horodatage");

-- AddForeignKey
ALTER TABLE "codes_pointage" ADD CONSTRAINT "codes_pointage_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pointages_bureau" ADD CONSTRAINT "pointages_bureau_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
