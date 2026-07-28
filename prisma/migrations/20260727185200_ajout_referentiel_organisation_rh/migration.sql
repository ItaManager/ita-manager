-- CreateEnum
CREATE TYPE "NiveauPoste" AS ENUM ('DIRECTION', 'CADRE', 'SUPPORT', 'OPERATIONNEL');

-- CreateTable
CREATE TABLE "Direction" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Direction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "directionId" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poste" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "niveau" "NiveauPoste" NOT NULL,
    "directionId" TEXT NOT NULL,
    "serviceId" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Poste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrilleSalariale" (
    "id" TEXT NOT NULL,
    "niveau" "NiveauPoste" NOT NULL,
    "salaireMin" DECIMAL(14,2) NOT NULL,
    "salaireMedian" DECIMAL(14,2) NOT NULL,
    "salaireMax" DECIMAL(14,2) NOT NULL,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrilleSalariale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Direction_code_key" ON "Direction"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Service_directionId_code_key" ON "Service"("directionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Poste_code_key" ON "Poste"("code");

-- CreateIndex
CREATE UNIQUE INDEX "GrilleSalariale_niveau_key" ON "GrilleSalariale"("niveau");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_directionId_fkey" FOREIGN KEY ("directionId") REFERENCES "Direction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poste" ADD CONSTRAINT "Poste_directionId_fkey" FOREIGN KEY ("directionId") REFERENCES "Direction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poste" ADD CONSTRAINT "Poste_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
