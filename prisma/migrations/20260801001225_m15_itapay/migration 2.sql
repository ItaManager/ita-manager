-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('PREPARE', 'VERIFIE', 'AUTORISE', 'EN_COURS', 'EN_ATTENTE', 'REUSSI', 'ECHOUE', 'ANNULE');

-- CreateEnum
CREATE TYPE "CategoriePaiement" AS ENUM ('SALAIRES', 'PRIMES', 'FOURNISSEURS', 'PRESTATAIRES', 'DIVERS');

-- CreateEnum
CREATE TYPE "NameMatch" AS ENUM ('MATCH', 'NO_MATCH', 'NAME_NOT_KNOWN');

-- CreateTable
CREATE TABLE "demandes_paiement" (
    "id" TEXT NOT NULL,
    "referenceIta" TEXT NOT NULL,
    "categorie" "CategoriePaiement" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "prepareeParId" UUID NOT NULL,
    "prepareeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montantTotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "demandes_paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_paiement" (
    "id" TEXT NOT NULL,
    "demandePaiementId" TEXT NOT NULL,
    "cleIdempotence" TEXT NOT NULL,
    "beneficiaireNom" TEXT NOT NULL,
    "beneficiaireMobile" TEXT NOT NULL,
    "montant" DECIMAL(12,2) NOT NULL,
    "motifPaiement" TEXT NOT NULL,
    "referenceIta" TEXT NOT NULL,
    "verifieLe" TIMESTAMP(3),
    "nameMatch" "NameMatch",
    "withinLimits" BOOLEAN,
    "statut" "StatutPaiement" NOT NULL DEFAULT 'PREPARE',
    "wavePayoutId" TEXT,
    "waveErrorCode" TEXT,
    "fraisWave" DECIMAL(12,2),
    "executeLe" TIMESTAMP(3),

    CONSTRAINT "lignes_paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autorisations_paiement" (
    "demandePaiementId" TEXT NOT NULL,
    "demandeeParId" UUID NOT NULL,
    "demandeeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autoriseeParId" UUID,
    "autoriseeLe" TIMESTAMP(3),
    "expireLe" TIMESTAMP(3),
    "montantFige" DECIMAL(12,2) NOT NULL,
    "nombreEchecs" INTEGER NOT NULL DEFAULT 0,
    "refuseeLe" TIMESTAMP(3),
    "motifRefus" TEXT
);

-- CreateTable
CREATE TABLE "tentatives_paiement" (
    "id" TEXT NOT NULL,
    "lignePaiementId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "envoyeeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "httpStatus" INTEGER,
    "reponseBrute" JSONB NOT NULL,
    "erreurCode" TEXT,

    CONSTRAINT "tentatives_paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "releves_paiement" (
    "id" TEXT NOT NULL,
    "demandePaiementId" TEXT NOT NULL,
    "numeroReleve" TEXT NOT NULL,
    "genereeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montantTotal" DECIMAL(12,2) NOT NULL,
    "fraisTotaux" DECIMAL(12,2) NOT NULL,
    "nombreLignes" INTEGER NOT NULL,
    "pdfUrl" TEXT,

    CONSTRAINT "releves_paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soldes_wave" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "solde" DECIMAL(12,2) NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "interrogeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "soldes_wave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "demandes_paiement_referenceIta_key" ON "demandes_paiement"("referenceIta");

-- CreateIndex
CREATE INDEX "demandes_paiement_prepareeParId_idx" ON "demandes_paiement"("prepareeParId");

-- CreateIndex
CREATE INDEX "demandes_paiement_categorie_idx" ON "demandes_paiement"("categorie");

-- CreateIndex
CREATE UNIQUE INDEX "lignes_paiement_cleIdempotence_key" ON "lignes_paiement"("cleIdempotence");

-- CreateIndex
CREATE INDEX "lignes_paiement_demandePaiementId_idx" ON "lignes_paiement"("demandePaiementId");

-- CreateIndex
CREATE INDEX "lignes_paiement_statut_idx" ON "lignes_paiement"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "autorisations_paiement_demandePaiementId_key" ON "autorisations_paiement"("demandePaiementId");

-- CreateIndex
CREATE INDEX "autorisations_paiement_demandeeParId_idx" ON "autorisations_paiement"("demandeeParId");

-- CreateIndex
CREATE INDEX "autorisations_paiement_autoriseeParId_idx" ON "autorisations_paiement"("autoriseeParId");

-- CreateIndex
CREATE INDEX "tentatives_paiement_lignePaiementId_idx" ON "tentatives_paiement"("lignePaiementId");

-- CreateIndex
CREATE UNIQUE INDEX "tentatives_paiement_lignePaiementId_numero_key" ON "tentatives_paiement"("lignePaiementId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "releves_paiement_demandePaiementId_key" ON "releves_paiement"("demandePaiementId");

-- CreateIndex
CREATE UNIQUE INDEX "releves_paiement_numeroReleve_key" ON "releves_paiement"("numeroReleve");

-- CreateIndex
CREATE INDEX "releves_paiement_numeroReleve_idx" ON "releves_paiement"("numeroReleve");

-- CreateIndex
CREATE INDEX "soldes_wave_date_idx" ON "soldes_wave"("date");

-- CreateIndex
CREATE UNIQUE INDEX "soldes_wave_date_key" ON "soldes_wave"("date");

-- AddForeignKey
ALTER TABLE "demandes_paiement" ADD CONSTRAINT "demandes_paiement_prepareeParId_fkey" FOREIGN KEY ("prepareeParId") REFERENCES "profils"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_paiement" ADD CONSTRAINT "lignes_paiement_demandePaiementId_fkey" FOREIGN KEY ("demandePaiementId") REFERENCES "demandes_paiement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autorisations_paiement" ADD CONSTRAINT "autorisations_paiement_demandePaiementId_fkey" FOREIGN KEY ("demandePaiementId") REFERENCES "demandes_paiement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autorisations_paiement" ADD CONSTRAINT "autorisations_paiement_demandeeParId_fkey" FOREIGN KEY ("demandeeParId") REFERENCES "profils"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autorisations_paiement" ADD CONSTRAINT "autorisations_paiement_autoriseeParId_fkey" FOREIGN KEY ("autoriseeParId") REFERENCES "profils"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentatives_paiement" ADD CONSTRAINT "tentatives_paiement_lignePaiementId_fkey" FOREIGN KEY ("lignePaiementId") REFERENCES "lignes_paiement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releves_paiement" ADD CONSTRAINT "releves_paiement_demandePaiementId_fkey" FOREIGN KEY ("demandePaiementId") REFERENCES "demandes_paiement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
