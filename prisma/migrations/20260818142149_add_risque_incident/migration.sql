-- CreateEnum
CREATE TYPE "TypeRisqueIncident" AS ENUM ('RISQUE', 'INCIDENT');

-- CreateEnum
CREATE TYPE "GraviteRisqueIncident" AS ENUM ('FAIBLE', 'MOYENNE', 'ELEVEE', 'CRITIQUE');

-- CreateEnum
CREATE TYPE "StatutRisqueIncident" AS ENUM ('OUVERT', 'EN_TRAITEMENT', 'RESOLU', 'CLOTURE');

-- CreateTable
CREATE TABLE "risques_incidents" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "type" "TypeRisqueIncident" NOT NULL,
    "gravite" "GraviteRisqueIncident" NOT NULL,
    "statut" "StatutRisqueIncident" NOT NULL DEFAULT 'OUVERT',
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "mesures" TEXT,
    "responsableId" TEXT,
    "dateIdentification" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateResolution" TIMESTAMP(3),
    "creePar" UUID NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risques_incidents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "risques_incidents" ADD CONSTRAINT "risques_incidents_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risques_incidents" ADD CONSTRAINT "risques_incidents_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "employes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
