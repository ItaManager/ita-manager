-- CreateEnum
CREATE TYPE "TypeEvenementPeriodePaie" AS ENUM ('OUVERTURE', 'VALIDATION_RH', 'VALIDATION_DT', 'VALIDATION_DFC', 'REFUS', 'EXPORT', 'CLOTURE', 'ANNULATION');

-- CreateEnum
CREATE TYPE "MoyenPaiement" AS ENUM ('VIREMENT', 'WAVE');

-- CreateTable
CREATE TABLE "periodes_paie" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE NOT NULL,
    "ouvertParId" UUID NOT NULL,
    "ouvertLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montantBrutTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "montantNetTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periodes_paie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_paie" (
    "id" TEXT NOT NULL,
    "periodeId" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "nomEmploye" TEXT NOT NULL,
    "posteLibelle" TEXT NOT NULL,
    "tauxJournalier" DECIMAL(10,2) NOT NULL,
    "joursPointes" DECIMAL(5,2) NOT NULL,
    "heuresSupp" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "montantBrut" DECIMAL(10,2) NOT NULL,
    "retenues" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "montantNet" DECIMAL(10,2) NOT NULL,
    "moyenPaiement" "MoyenPaiement" NOT NULL,
    "compteDestination" TEXT NOT NULL,
    "signalZeroJour" BOOLEAN NOT NULL DEFAULT false,
    "signalDerogation" BOOLEAN NOT NULL DEFAULT false,
    "signalEcartImportant" BOOLEAN NOT NULL DEFAULT false,
    "commentaireSignal" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lignes_paie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evenements_periode_paie" (
    "id" TEXT NOT NULL,
    "periodeId" TEXT NOT NULL,
    "type" "TypeEvenementPeriodePaie" NOT NULL,
    "auteurId" UUID NOT NULL,
    "auteurNom" TEXT NOT NULL,
    "commentaire" TEXT,
    "motifRefus" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evenements_periode_paie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exports_paie" (
    "id" TEXT NOT NULL,
    "periodeId" TEXT NOT NULL,
    "typeExport" TEXT NOT NULL,
    "genereParId" UUID NOT NULL,
    "genereParNom" TEXT NOT NULL,
    "genereLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fichierNom" TEXT NOT NULL,
    "fichierUrl" TEXT,
    "condensat" TEXT NOT NULL,
    "montantTotal" DECIMAL(12,2) NOT NULL,
    "nombreLignes" INTEGER NOT NULL,

    CONSTRAINT "exports_paie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "periodes_paie_projetId_idx" ON "periodes_paie"("projetId");

-- CreateIndex
CREATE INDEX "periodes_paie_ouvertParId_idx" ON "periodes_paie"("ouvertParId");

-- CreateIndex
CREATE INDEX "periodes_paie_dateDebut_idx" ON "periodes_paie"("dateDebut");

-- CreateIndex
CREATE INDEX "periodes_paie_dateFin_idx" ON "periodes_paie"("dateFin");

-- CreateIndex
CREATE INDEX "lignes_paie_employeId_idx" ON "lignes_paie"("employeId");

-- CreateIndex
CREATE UNIQUE INDEX "lignes_paie_periodeId_employeId_key" ON "lignes_paie"("periodeId", "employeId");

-- CreateIndex
CREATE INDEX "evenements_periode_paie_periodeId_idx" ON "evenements_periode_paie"("periodeId");

-- CreateIndex
CREATE INDEX "evenements_periode_paie_type_idx" ON "evenements_periode_paie"("type");

-- CreateIndex
CREATE INDEX "exports_paie_periodeId_idx" ON "exports_paie"("periodeId");

-- AddForeignKey
ALTER TABLE "periodes_paie" ADD CONSTRAINT "periodes_paie_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_paie" ADD CONSTRAINT "lignes_paie_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "periodes_paie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_paie" ADD CONSTRAINT "lignes_paie_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evenements_periode_paie" ADD CONSTRAINT "evenements_periode_paie_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "periodes_paie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports_paie" ADD CONSTRAINT "exports_paie_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "periodes_paie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
