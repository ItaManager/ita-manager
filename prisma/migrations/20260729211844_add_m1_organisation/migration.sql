-- CreateEnum
CREATE TYPE "NiveauHierarchique" AS ENUM ('DIRECTION', 'CADRE', 'SUPPORT', 'OPERATIONNEL');

-- CreateTable
CREATE TABLE "directions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "reserveAdmin" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,
    "archiveLe" TIMESTAMP(3),

    CONSTRAINT "directions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "directionId" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,
    "archiveLe" TIMESTAMP(3),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "niveau" "NiveauHierarchique" NOT NULL,
    "serviceId" TEXT,
    "directionId" TEXT NOT NULL,
    "reserveAdmin" BOOLEAN NOT NULL DEFAULT false,
    "titulaireUnique" BOOLEAN NOT NULL DEFAULT false,
    "ouvreDroitConges" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,
    "archiveLe" TIMESTAMP(3),

    CONSTRAINT "postes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "directions_code_key" ON "directions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "services_code_key" ON "services"("code");

-- CreateIndex
CREATE INDEX "services_directionId_idx" ON "services"("directionId");

-- CreateIndex
CREATE UNIQUE INDEX "postes_code_key" ON "postes"("code");

-- CreateIndex
CREATE INDEX "postes_directionId_idx" ON "postes"("directionId");

-- CreateIndex
CREATE INDEX "postes_serviceId_idx" ON "postes"("serviceId");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_directionId_fkey" FOREIGN KEY ("directionId") REFERENCES "directions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postes" ADD CONSTRAINT "postes_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postes" ADD CONSTRAINT "postes_directionId_fkey" FOREIGN KEY ("directionId") REFERENCES "directions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
