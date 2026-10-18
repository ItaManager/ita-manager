-- CreateEnum
CREATE TYPE "TypeDemande" AS ENUM ('INITIALE', 'REGULARISATION');

-- CreateEnum
CREATE TYPE "StatutDemandeAchat" AS ENUM ('BROUILLON', 'ATTENTE_N1', 'ATTENTE_ACHATS', 'ATTENTE_COMITE', 'BC_EMIS', 'PARTIELLE', 'SOLDEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "StatutReception" AS ENUM ('CONFORME', 'RESERVE', 'REFUS');

-- CreateEnum
CREATE TYPE "TypeEvenementAchat" AS ENUM ('SOUMISSION', 'VALIDATION_N1', 'REFUS_N1', 'INSTRUCTION', 'TRANSMISSION_COMITE', 'AVIS_COMITE', 'EMISSION_BC', 'TRANSMISSION_LOG', 'RECEPTION', 'VALIDATION_CONFORMITE', 'FACTURATION', 'REFUS');

-- CreateEnum
CREATE TYPE "EtatAvis" AS ENUM ('ATTENTE', 'FAVORABLE', 'DEFAVORABLE');

-- CreateTable
CREATE TABLE "unites" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creePar" TEXT NOT NULL,

    CONSTRAINT "unites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "designationNormalisee" TEXT NOT NULL,
    "uniteId" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creePar" TEXT NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fournisseurs" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nomNormalise" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creePar" TEXT NOT NULL,

    CONSTRAINT "fournisseurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prix_fournisseur" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "fournisseurId" TEXT NOT NULL,
    "prixHT" DECIMAL(12,2) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creePar" TEXT NOT NULL,

    CONSTRAINT "prix_fournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demandes_achat" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "type" "TypeDemande" NOT NULL,
    "demandeurId" TEXT NOT NULL,
    "beneficiaireId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dateBesoin" DATE NOT NULL,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demandes_achat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_achat" (
    "id" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "articleId" TEXT,
    "designation" TEXT NOT NULL,
    "quantite" DECIMAL(10,3) NOT NULL,
    "unite" TEXT NOT NULL,
    "fournisseurId" TEXT,
    "prixUnitaire" DECIMAL(12,2),
    "tauxTva" DECIMAL(5,2),
    "quantiteRecue" DECIMAL(10,3),
    "statutReception" "StatutReception",
    "numBC" TEXT,
    "facture" TEXT,
    "criteres" TEXT,

    CONSTRAINT "lignes_achat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evenements_achat" (
    "id" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "type" "TypeEvenementAchat" NOT NULL,
    "auteurId" TEXT NOT NULL,
    "auteurNom" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "evenements_achat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avis_comite" (
    "id" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "validateur" TEXT NOT NULL,
    "etat" "EtatAvis" NOT NULL DEFAULT 'ATTENTE',
    "timestamp" TIMESTAMP(3),
    "motif" TEXT,

    CONSTRAINT "avis_comite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unites_libelle_key" ON "unites"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "articles_designationNormalisee_key" ON "articles"("designationNormalisee");

-- CreateIndex
CREATE INDEX "articles_designation_idx" ON "articles"("designation");

-- CreateIndex
CREATE UNIQUE INDEX "fournisseurs_nomNormalise_key" ON "fournisseurs"("nomNormalise");

-- CreateIndex
CREATE INDEX "fournisseurs_nom_idx" ON "fournisseurs"("nom");

-- CreateIndex
CREATE INDEX "prix_fournisseur_articleId_idx" ON "prix_fournisseur"("articleId");

-- CreateIndex
CREATE INDEX "prix_fournisseur_fournisseurId_idx" ON "prix_fournisseur"("fournisseurId");

-- CreateIndex
CREATE UNIQUE INDEX "prix_fournisseur_articleId_fournisseurId_key" ON "prix_fournisseur"("articleId", "fournisseurId");

-- CreateIndex
CREATE UNIQUE INDEX "demandes_achat_ref_key" ON "demandes_achat"("ref");

-- CreateIndex
CREATE INDEX "demandes_achat_ref_idx" ON "demandes_achat"("ref");

-- CreateIndex
CREATE INDEX "demandes_achat_demandeurId_idx" ON "demandes_achat"("demandeurId");

-- CreateIndex
CREATE INDEX "demandes_achat_beneficiaireId_idx" ON "demandes_achat"("beneficiaireId");

-- CreateIndex
CREATE INDEX "lignes_achat_demandeId_idx" ON "lignes_achat"("demandeId");

-- CreateIndex
CREATE INDEX "evenements_achat_demandeId_timestamp_idx" ON "evenements_achat"("demandeId", "timestamp");

-- CreateIndex
CREATE INDEX "avis_comite_demandeId_idx" ON "avis_comite"("demandeId");

-- CreateIndex
CREATE UNIQUE INDEX "avis_comite_demandeId_role_key" ON "avis_comite"("demandeId", "role");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "unites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prix_fournisseur" ADD CONSTRAINT "prix_fournisseur_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prix_fournisseur" ADD CONSTRAINT "prix_fournisseur_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "fournisseurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_achat" ADD CONSTRAINT "demandes_achat_demandeurId_fkey" FOREIGN KEY ("demandeurId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_achat" ADD CONSTRAINT "demandes_achat_beneficiaireId_fkey" FOREIGN KEY ("beneficiaireId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_achat" ADD CONSTRAINT "lignes_achat_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes_achat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_achat" ADD CONSTRAINT "lignes_achat_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_achat" ADD CONSTRAINT "lignes_achat_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "fournisseurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evenements_achat" ADD CONSTRAINT "evenements_achat_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes_achat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_comite" ADD CONSTRAINT "avis_comite_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes_achat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
