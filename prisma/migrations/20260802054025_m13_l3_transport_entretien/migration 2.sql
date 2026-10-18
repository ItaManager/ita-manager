-- CreateEnum
CREATE TYPE "TypeDemandeTransport" AS ENUM ('MATERIEL', 'PERSONNEL', 'MIXTE');

-- CreateEnum
CREATE TYPE "StatutDemandeTransport" AS ENUM ('EN_ATTENTE', 'APPROUVEE', 'AFFECTEE', 'EN_COURS', 'TERMINEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "TypeEntretien" AS ENUM ('PREVENTIF', 'CURATIF', 'REVISION');

-- CreateTable
CREATE TABLE "demandes_transport" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "TypeDemandeTransport" NOT NULL,
    "statut" "StatutDemandeTransport" NOT NULL DEFAULT 'EN_ATTENTE',
    "demandeurId" UUID NOT NULL,
    "materielId" TEXT,
    "lieuDepartId" TEXT NOT NULL,
    "lieuArriveeId" TEXT NOT NULL,
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE,
    "chauffeurId" TEXT,
    "description" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demandes_transport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans_entretien" (
    "id" TEXT NOT NULL,
    "materielId" TEXT NOT NULL,
    "type" "TypeEntretien" NOT NULL,
    "description" TEXT NOT NULL,
    "periodiciteJours" INTEGER,
    "seuilCompteur" INTEGER,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_entretien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entretiens" (
    "id" TEXT NOT NULL,
    "planId" TEXT,
    "materielId" TEXT NOT NULL,
    "type" "TypeEntretien" NOT NULL,
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE,
    "compteur" INTEGER,
    "cout" DECIMAL(15,2),
    "technicien" TEXT,
    "description" TEXT NOT NULL,
    "observations" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entretiens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "demandes_transport_reference_key" ON "demandes_transport"("reference");

-- CreateIndex
CREATE INDEX "demandes_transport_demandeurId_idx" ON "demandes_transport"("demandeurId");

-- CreateIndex
CREATE INDEX "demandes_transport_materielId_idx" ON "demandes_transport"("materielId");

-- CreateIndex
CREATE INDEX "demandes_transport_statut_idx" ON "demandes_transport"("statut");

-- CreateIndex
CREATE INDEX "demandes_transport_dateDebut_idx" ON "demandes_transport"("dateDebut");

-- CreateIndex
CREATE INDEX "plans_entretien_materielId_idx" ON "plans_entretien"("materielId");

-- CreateIndex
CREATE INDEX "entretiens_materielId_idx" ON "entretiens"("materielId");

-- CreateIndex
CREATE INDEX "entretiens_planId_idx" ON "entretiens"("planId");

-- CreateIndex
CREATE INDEX "entretiens_type_idx" ON "entretiens"("type");

-- CreateIndex
CREATE INDEX "entretiens_dateDebut_idx" ON "entretiens"("dateDebut");

-- AddForeignKey
ALTER TABLE "demandes_transport" ADD CONSTRAINT "demandes_transport_demandeurId_fkey" FOREIGN KEY ("demandeurId") REFERENCES "profils"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_transport" ADD CONSTRAINT "demandes_transport_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "materiel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_transport" ADD CONSTRAINT "demandes_transport_lieuDepartId_fkey" FOREIGN KEY ("lieuDepartId") REFERENCES "lieux_stockage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_transport" ADD CONSTRAINT "demandes_transport_lieuArriveeId_fkey" FOREIGN KEY ("lieuArriveeId") REFERENCES "lieux_stockage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_transport" ADD CONSTRAINT "demandes_transport_chauffeurId_fkey" FOREIGN KEY ("chauffeurId") REFERENCES "employes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans_entretien" ADD CONSTRAINT "plans_entretien_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "materiel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entretiens" ADD CONSTRAINT "entretiens_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans_entretien"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entretiens" ADD CONSTRAINT "entretiens_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "materiel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
