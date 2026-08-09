-- CreateEnum
CREATE TYPE "MoyenTransport" AS ENUM ('VEHICULE_ITA', 'TRANSPORT_COMMUN', 'VEHICULE_PERSONNEL', 'AVION', 'AUTRE');

-- CreateEnum
CREATE TYPE "EtapeRefus" AS ENUM ('N1', 'RH');

-- CreateEnum
CREATE TYPE "MomentFrais" AS ENUM ('ESTIMATION', 'DEPENSE_REELLE');

-- CreateEnum
CREATE TYPE "CategorieFrais" AS ENUM ('TRANSPORT', 'HEBERGEMENT', 'RESTAURATION', 'CARBURANT', 'PEAGE', 'COMMUNICATION', 'AUTRE');

-- CreateEnum
CREATE TYPE "MoyenPaiementMission" AS ENUM ('WAVE', 'ESPECES');

-- CreateEnum
CREATE TYPE "SensRegularisation" AS ENUM ('COMPLEMENT_DU', 'RELIQUAT_A_RENDRE', 'EQUILIBRE');

-- CreateEnum
CREATE TYPE "MoyenApurement" AS ENUM ('WAVE', 'ESPECES', 'RETENUE_SUR_SALAIRE');

-- AlterTable
ALTER TABLE "_Composition" ADD CONSTRAINT "_Composition_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_Composition_AB_unique";

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "demandeurId" TEXT NOT NULL,
    "objet" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "paysId" TEXT,
    "moyenTransport" "MoyenTransport" NOT NULL,
    "dateDepart" DATE NOT NULL,
    "dateRetour" DATE NOT NULL,
    "fraisEstimes" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "projetId" TEXT,
    "soumiseLe" TIMESTAMP(3),
    "viseeN1Le" TIMESTAMP(3),
    "viseeN1ParId" UUID,
    "valideeRhLe" TIMESTAMP(3),
    "valideeRhParId" UUID,
    "avanceVerseeLe" TIMESTAMP(3),
    "rapportDeposeLe" TIMESTAMP(3),
    "clotureeLe" TIMESTAMP(3),
    "clotureeParId" UUID,
    "refuseeLe" TIMESTAMP(3),
    "refuseeParId" UUID,
    "motifRefus" TEXT,
    "etapeRefus" "EtapeRefus",
    "annuleeLe" TIMESTAMP(3),
    "annuleeParId" UUID,
    "motifAnnulation" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_frais" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "moment" "MomentFrais" NOT NULL,
    "categorie" "CategorieFrais" NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" DECIMAL(12,0) NOT NULL,
    "accepteeLe" TIMESTAMP(3),
    "accepteeParId" UUID,
    "rejeteeLe" TIMESTAMP(3),
    "rejeteeParId" UUID,
    "motifRejet" TEXT,
    "justificatif" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lignes_frais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapports_mission" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "objetRealise" TEXT NOT NULL,
    "resultats" TEXT NOT NULL,
    "difficultes" TEXT,
    "recommandations" TEXT,
    "deposeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rapports_mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versements_avance" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "montant" DECIMAL(12,0) NOT NULL,
    "moyen" "MoyenPaiementMission" NOT NULL,
    "demandePaiementId" TEXT,
    "emargement" TEXT,
    "effectueLe" TIMESTAMP(3),
    "effectueParId" UUID,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versements_avance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regularisations" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "totalAvance" DECIMAL(12,0) NOT NULL,
    "totalJustifie" DECIMAL(12,0) NOT NULL,
    "sens" "SensRegularisation" NOT NULL,
    "montant" DECIMAL(12,0) NOT NULL,
    "apureeLe" TIMESTAMP(3),
    "apureeParId" UUID,
    "moyenApurement" "MoyenApurement",
    "demandePaiementId" TEXT,
    "emargement" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regularisations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "missions_reference_key" ON "missions"("reference");

-- CreateIndex
CREATE INDEX "missions_demandeurId_dateDepart_idx" ON "missions"("demandeurId", "dateDepart");

-- CreateIndex
CREATE INDEX "missions_dateRetour_idx" ON "missions"("dateRetour");

-- CreateIndex
CREATE INDEX "lignes_frais_missionId_moment_idx" ON "lignes_frais"("missionId", "moment");

-- CreateIndex
CREATE UNIQUE INDEX "rapports_mission_missionId_key" ON "rapports_mission"("missionId");

-- CreateIndex
CREATE INDEX "versements_avance_missionId_idx" ON "versements_avance"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "regularisations_missionId_key" ON "regularisations"("missionId");

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_demandeurId_fkey" FOREIGN KEY ("demandeurId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_viseeN1ParId_fkey" FOREIGN KEY ("viseeN1ParId") REFERENCES "profils"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_valideeRhParId_fkey" FOREIGN KEY ("valideeRhParId") REFERENCES "profils"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_clotureeParId_fkey" FOREIGN KEY ("clotureeParId") REFERENCES "profils"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_refuseeParId_fkey" FOREIGN KEY ("refuseeParId") REFERENCES "profils"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_annuleeParId_fkey" FOREIGN KEY ("annuleeParId") REFERENCES "profils"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_frais" ADD CONSTRAINT "lignes_frais_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_frais" ADD CONSTRAINT "lignes_frais_accepteeParId_fkey" FOREIGN KEY ("accepteeParId") REFERENCES "profils"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_frais" ADD CONSTRAINT "lignes_frais_rejeteeParId_fkey" FOREIGN KEY ("rejeteeParId") REFERENCES "profils"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports_mission" ADD CONSTRAINT "rapports_mission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versements_avance" ADD CONSTRAINT "versements_avance_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versements_avance" ADD CONSTRAINT "versements_avance_effectueParId_fkey" FOREIGN KEY ("effectueParId") REFERENCES "profils"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regularisations" ADD CONSTRAINT "regularisations_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regularisations" ADD CONSTRAINT "regularisations_apureeParId_fkey" FOREIGN KEY ("apureeParId") REFERENCES "profils"("id") ON DELETE SET NULL ON UPDATE CASCADE;
