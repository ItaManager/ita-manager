-- CreateEnum
CREATE TYPE "StatutFactureFournisseur" AS ENUM ('BROUILLON', 'A_RECEVOIR', 'A_VALIDER', 'A_VALIDER_DG', 'A_PAYER', 'PARTIELLE', 'SOLDEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "StatutPaiementFournisseur" AS ENUM ('EN_ATTENTE_PREUVE', 'CONFIRME');

-- CreateEnum
CREATE TYPE "CategorieFournisseur" AS ENUM ('CARBURANT', 'MATERIAUX', 'LOCATION', 'SERVICES', 'AUTRE');

-- CreateEnum
CREATE TYPE "ModePaiementFournisseur" AS ENUM ('VIREMENT', 'MOBILE_MONEY', 'ESPECES', 'CHEQUE');

-- CreateEnum
CREATE TYPE "CircuitCarburant" AS ENUM ('STATION', 'GARAGE');

-- CreateEnum
CREATE TYPE "StatutDemandeCarburant" AS ENUM ('BROUILLON', 'ATTENTE_VALIDATION', 'VALIDEE', 'DISTRIBUEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "ModeRemiseStation" AS ENUM ('ARGENT_REMIS', 'ACCOMPAGNEMENT');

-- CreateEnum
CREATE TYPE "StatutRemise" AS ENUM ('EN_COURS', 'CLOTURE');

-- CreateEnum
CREATE TYPE "StatutDemandeRechargement" AS ENUM ('BROUILLON', 'ATTENTE_VALIDATION', 'VALIDEE', 'LIVREE', 'REFUSEE');

-- AlterTable
ALTER TABLE "fournisseurs" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "categorie" "CategorieFournisseur",
ADD COLUMN     "contact" TEXT,
ADD COLUMN     "modePaiementPrefere" "ModePaiementFournisseur",
ADD COLUMN     "rccm" TEXT;

-- AlterTable
ALTER TABLE "lieux_stockage" ADD COLUMN     "capaciteCarburant" DECIMAL(10,2),
ADD COLUMN     "responsableId" TEXT,
ADD COLUMN     "seuilAlerte" INTEGER,
ADD COLUMN     "stockActuel" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "factures_fournisseur" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "fournisseurId" TEXT NOT NULL,
    "montantHT" DECIMAL(12,0) NOT NULL,
    "montantTVA" DECIMAL(12,0) NOT NULL,
    "montantTTC" DECIMAL(12,0) NOT NULL,
    "montantPaye" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "dateFacture" DATE NOT NULL,
    "dateEcheance" DATE,
    "projetId" TEXT,
    "urlFacture" TEXT,
    "receptionConfirmee" BOOLEAN NOT NULL DEFAULT false,
    "receptionneParId" UUID,
    "receptionneLe" DATE,
    "receptionCommentaire" TEXT,
    "valideParId" UUID,
    "valideLe" DATE,
    "valideDgParId" UUID,
    "valideDgLe" DATE,
    "statutFacture" "StatutFactureFournisseur" NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creePar" TEXT NOT NULL,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "factures_fournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements_fournisseur" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "factureId" TEXT NOT NULL,
    "fournisseurId" TEXT NOT NULL,
    "montantPaye" DECIMAL(12,0) NOT NULL,
    "modePaiement" "ModePaiementFournisseur" NOT NULL,
    "datePaiement" DATE NOT NULL,
    "urlPreuve" TEXT,
    "statutPaiement" "StatutPaiementFournisseur" NOT NULL,
    "demandePaiementId" TEXT,
    "effectueParId" UUID NOT NULL,
    "effectueLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creePar" TEXT NOT NULL,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paiements_fournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demandes_carburant" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "demandeurId" TEXT NOT NULL,
    "materielId" TEXT NOT NULL,
    "projetId" TEXT,
    "typeCarburant" "TypeCarburant" NOT NULL,
    "quantiteSouhai" DECIMAL(10,2) NOT NULL,
    "compteurActuel" DECIMAL(10,2) NOT NULL,
    "uniteCompteur" "UniteCompteur" NOT NULL,
    "circuit" "CircuitCarburant" NOT NULL,
    "garageId" TEXT,
    "statut" "StatutDemandeCarburant" NOT NULL,
    "valideParId" UUID,
    "valideLe" DATE,
    "distributionId" TEXT,
    "remiseStationId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demandes_carburant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remises_station" (
    "id" TEXT NOT NULL,
    "demandeCarburantId" TEXT,
    "modeRemise" "ModeRemiseStation" NOT NULL,
    "montantRemis" DECIMAL(12,0),
    "montantDepense" DECIMAL(12,0),
    "reliquat" DECIMAL(12,0),
    "urlRecu" TEXT,
    "statutRemise" "StatutRemise" NOT NULL,
    "clotureparId" UUID,
    "clotureLe" DATE,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remises_station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demandes_rechargement" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "projetId" TEXT,
    "typeCarburant" "TypeCarburant" NOT NULL,
    "quantiteDemandee" DECIMAL(10,2) NOT NULL,
    "quantiteLivree" DECIMAL(10,2),
    "statut" "StatutDemandeRechargement" NOT NULL,
    "demandeurId" TEXT NOT NULL,
    "valideParId" UUID,
    "valideLe" DATE,
    "receptionneParId" UUID,
    "receptionneLe" DATE,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demandes_rechargement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "factures_fournisseur_fournisseurId_statutFacture_idx" ON "factures_fournisseur"("fournisseurId", "statutFacture");

-- CreateIndex
CREATE INDEX "factures_fournisseur_projetId_idx" ON "factures_fournisseur"("projetId");

-- CreateIndex
CREATE INDEX "factures_fournisseur_dateEcheance_idx" ON "factures_fournisseur"("dateEcheance");

-- CreateIndex
CREATE UNIQUE INDEX "factures_fournisseur_fournisseurId_reference_key" ON "factures_fournisseur"("fournisseurId", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_fournisseur_reference_key" ON "paiements_fournisseur"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_fournisseur_demandePaiementId_key" ON "paiements_fournisseur"("demandePaiementId");

-- CreateIndex
CREATE INDEX "paiements_fournisseur_factureId_idx" ON "paiements_fournisseur"("factureId");

-- CreateIndex
CREATE INDEX "paiements_fournisseur_fournisseurId_datePaiement_idx" ON "paiements_fournisseur"("fournisseurId", "datePaiement");

-- CreateIndex
CREATE UNIQUE INDEX "demandes_carburant_reference_key" ON "demandes_carburant"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "demandes_carburant_distributionId_key" ON "demandes_carburant"("distributionId");

-- CreateIndex
CREATE UNIQUE INDEX "demandes_carburant_remiseStationId_key" ON "demandes_carburant"("remiseStationId");

-- CreateIndex
CREATE INDEX "demandes_carburant_demandeurId_statut_idx" ON "demandes_carburant"("demandeurId", "statut");

-- CreateIndex
CREATE INDEX "demandes_carburant_materielId_idx" ON "demandes_carburant"("materielId");

-- CreateIndex
CREATE INDEX "demandes_carburant_projetId_idx" ON "demandes_carburant"("projetId");

-- CreateIndex
CREATE UNIQUE INDEX "remises_station_demandeCarburantId_key" ON "remises_station"("demandeCarburantId");

-- CreateIndex
CREATE UNIQUE INDEX "demandes_rechargement_reference_key" ON "demandes_rechargement"("reference");

-- CreateIndex
CREATE INDEX "demandes_rechargement_garageId_statut_idx" ON "demandes_rechargement"("garageId", "statut");

-- CreateIndex
CREATE INDEX "demandes_rechargement_projetId_idx" ON "demandes_rechargement"("projetId");

-- AddForeignKey
ALTER TABLE "lieux_stockage" ADD CONSTRAINT "lieux_stockage_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "employes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures_fournisseur" ADD CONSTRAINT "factures_fournisseur_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "fournisseurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures_fournisseur" ADD CONSTRAINT "factures_fournisseur_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements_fournisseur" ADD CONSTRAINT "paiements_fournisseur_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "factures_fournisseur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements_fournisseur" ADD CONSTRAINT "paiements_fournisseur_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "fournisseurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements_fournisseur" ADD CONSTRAINT "paiements_fournisseur_demandePaiementId_fkey" FOREIGN KEY ("demandePaiementId") REFERENCES "demandes_paiement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_carburant" ADD CONSTRAINT "demandes_carburant_demandeurId_fkey" FOREIGN KEY ("demandeurId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_carburant" ADD CONSTRAINT "demandes_carburant_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "materiel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_carburant" ADD CONSTRAINT "demandes_carburant_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_carburant" ADD CONSTRAINT "demandes_carburant_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "lieux_stockage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_carburant" ADD CONSTRAINT "demandes_carburant_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "distributions_carburant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_carburant" ADD CONSTRAINT "demandes_carburant_remiseStationId_fkey" FOREIGN KEY ("remiseStationId") REFERENCES "remises_station"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_rechargement" ADD CONSTRAINT "demandes_rechargement_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "lieux_stockage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_rechargement" ADD CONSTRAINT "demandes_rechargement_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_rechargement" ADD CONSTRAINT "demandes_rechargement_demandeurId_fkey" FOREIGN KEY ("demandeurId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
