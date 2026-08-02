-- CreateEnum
CREATE TYPE "SensMouvement" AS ENUM ('ENTREE', 'SORTIE', 'AJUSTEMENT');

-- CreateEnum
CREATE TYPE "StatutInventaire" AS ENUM ('OUVERT', 'CLOS');

-- CreateEnum
CREATE TYPE "UniteCompteur" AS ENUM ('KILOMETRE', 'HEURE');

-- CreateEnum
CREATE TYPE "SourceReleve" AS ENUM ('INSPECTION', 'SAISIE_GARAGE', 'RELEVE_ACTIVITE');

-- CreateEnum
CREATE TYPE "EtatPoint" AS ENUM ('BON', 'MAUVAIS', 'ABSENT');

-- CreateEnum
CREATE TYPE "GrilleInspection" AS ENUM ('PHYSIQUE', 'DOCUMENT', 'EQUIPEMENT');

-- CreateEnum
CREATE TYPE "MomentInspection" AS ENUM ('ENTREE', 'SORTIE');

-- CreateEnum
CREATE TYPE "NiveauCarburant" AS ENUM ('VIDE', 'UN_HUITIEME', 'UN_QUART', 'TROIS_HUITIEMES', 'MOITIE', 'CINQ_HUITIEMES', 'TROIS_QUARTS', 'SEPT_HUITIEMES', 'PLEIN');

-- CreateEnum
CREATE TYPE "IssueReception" AS ENUM ('CONFORME', 'AVEC_RESERVE', 'NON_CONFORME');

-- CreateTable
CREATE TABLE "articles_stock" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "seuilAlerte" DECIMAL(10,2),
    "famille" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bons_mouvement" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "sens" "SensMouvement" NOT NULL,
    "lieuOrigineId" TEXT,
    "lieuDestinationId" TEXT,
    "motif" TEXT NOT NULL,
    "emetteurId" UUID NOT NULL,
    "emetteurNom" TEXT NOT NULL,
    "dateMouvement" DATE NOT NULL,
    "valideParId" UUID,
    "valideLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bons_mouvement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mouvements_stock" (
    "id" TEXT NOT NULL,
    "articleStockId" TEXT NOT NULL,
    "sens" "SensMouvement" NOT NULL,
    "quantite" DECIMAL(10,2) NOT NULL,
    "lieuStockageId" TEXT NOT NULL,
    "bonMouvementId" TEXT,
    "motif" TEXT NOT NULL,
    "prixUnitaire" DECIMAL(10,2),
    "dateMouvement" DATE NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mouvements_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventaires" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "lieuStockageId" TEXT NOT NULL,
    "dateOuverture" DATE NOT NULL,
    "dateClôture" DATE,
    "statut" "StatutInventaire" NOT NULL DEFAULT 'OUVERT',
    "responsableId" UUID NOT NULL,
    "responsableNom" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_inventaire" (
    "id" TEXT NOT NULL,
    "inventaireId" TEXT NOT NULL,
    "articleStockId" TEXT NOT NULL,
    "soldeTheorique" DECIMAL(10,2) NOT NULL,
    "quantiteComptee" DECIMAL(10,2) NOT NULL,
    "ecart" DECIMAL(10,2) NOT NULL,
    "justification" TEXT,
    "ajuste" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lignes_inventaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "releves_compteur" (
    "id" TEXT NOT NULL,
    "materielId" TEXT NOT NULL,
    "valeur" DECIMAL(10,2) NOT NULL,
    "unite" "UniteCompteur" NOT NULL,
    "releveLe" DATE NOT NULL,
    "source" "SourceReleve" NOT NULL,
    "inspectionId" TEXT,
    "anomalie" BOOLEAN NOT NULL DEFAULT false,
    "releveParId" UUID NOT NULL,
    "releveParNom" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "releves_compteur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_inspection" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "grille" "GrilleInspection" NOT NULL,
    "typesMateriel" TEXT NOT NULL DEFAULT '[]',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "points_inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "materielId" TEXT NOT NULL,
    "moment" "MomentInspection" NOT NULL,
    "mouvementId" TEXT,
    "demandeTransportId" TEXT,
    "dateHeure" TIMESTAMP(3) NOT NULL,
    "lieuId" TEXT NOT NULL,
    "provenance" TEXT,
    "destination" TEXT,
    "compteur" DECIMAL(10,2),
    "niveauCarburant" "NiveauCarburant",
    "conducteurId" UUID,
    "conducteurNom" TEXT,
    "transporteur" TEXT,
    "verificateurId" UUID NOT NULL,
    "verificateurNom" TEXT NOT NULL,
    "etatGeneral" "EtatPoint" NOT NULL,
    "observations" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_inspection" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "pointId" TEXT NOT NULL,
    "etat" "EtatPoint" NOT NULL,
    "observation" TEXT,
    "photoId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lignes_inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receptions" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "commandeId" TEXT,
    "fournisseurId" TEXT,
    "fournisseurNom" TEXT NOT NULL,
    "dateReception" DATE NOT NULL,
    "receptionneParId" UUID NOT NULL,
    "receptionneParNom" TEXT NOT NULL,
    "valideParId" UUID,
    "valideLe" TIMESTAMP(3),
    "issue" "IssueReception",
    "motifRefus" TEXT,
    "photoId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_reception" (
    "id" TEXT NOT NULL,
    "receptionId" TEXT NOT NULL,
    "articleStockId" TEXT NOT NULL,
    "quantiteCommandee" DECIMAL(10,2) NOT NULL,
    "quantiteLivree" DECIMAL(10,2) NOT NULL,
    "ecart" DECIMAL(10,2) NOT NULL,
    "conforme" BOOLEAN NOT NULL DEFAULT true,
    "observation" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lignes_reception_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_stock_reference_key" ON "articles_stock"("reference");

-- CreateIndex
CREATE INDEX "articles_stock_famille_idx" ON "articles_stock"("famille");

-- CreateIndex
CREATE UNIQUE INDEX "bons_mouvement_reference_key" ON "bons_mouvement"("reference");

-- CreateIndex
CREATE INDEX "bons_mouvement_sens_idx" ON "bons_mouvement"("sens");

-- CreateIndex
CREATE INDEX "bons_mouvement_dateMouvement_idx" ON "bons_mouvement"("dateMouvement");

-- CreateIndex
CREATE INDEX "mouvements_stock_articleStockId_dateMouvement_idx" ON "mouvements_stock"("articleStockId", "dateMouvement");

-- CreateIndex
CREATE INDEX "mouvements_stock_lieuStockageId_idx" ON "mouvements_stock"("lieuStockageId");

-- CreateIndex
CREATE INDEX "mouvements_stock_bonMouvementId_idx" ON "mouvements_stock"("bonMouvementId");

-- CreateIndex
CREATE UNIQUE INDEX "inventaires_reference_key" ON "inventaires"("reference");

-- CreateIndex
CREATE INDEX "inventaires_lieuStockageId_idx" ON "inventaires"("lieuStockageId");

-- CreateIndex
CREATE INDEX "inventaires_statut_idx" ON "inventaires"("statut");

-- CreateIndex
CREATE INDEX "lignes_inventaire_inventaireId_idx" ON "lignes_inventaire"("inventaireId");

-- CreateIndex
CREATE INDEX "lignes_inventaire_articleStockId_idx" ON "lignes_inventaire"("articleStockId");

-- CreateIndex
CREATE INDEX "releves_compteur_materielId_releveLe_idx" ON "releves_compteur"("materielId", "releveLe");

-- CreateIndex
CREATE INDEX "releves_compteur_inspectionId_idx" ON "releves_compteur"("inspectionId");

-- CreateIndex
CREATE UNIQUE INDEX "points_inspection_libelle_key" ON "points_inspection"("libelle");

-- CreateIndex
CREATE INDEX "points_inspection_grille_actif_idx" ON "points_inspection"("grille", "actif");

-- CreateIndex
CREATE INDEX "inspections_materielId_dateHeure_idx" ON "inspections"("materielId", "dateHeure");

-- CreateIndex
CREATE INDEX "inspections_moment_idx" ON "inspections"("moment");

-- CreateIndex
CREATE INDEX "inspections_lieuId_idx" ON "inspections"("lieuId");

-- CreateIndex
CREATE INDEX "lignes_inspection_inspectionId_idx" ON "lignes_inspection"("inspectionId");

-- CreateIndex
CREATE INDEX "lignes_inspection_pointId_idx" ON "lignes_inspection"("pointId");

-- CreateIndex
CREATE UNIQUE INDEX "receptions_reference_key" ON "receptions"("reference");

-- CreateIndex
CREATE INDEX "receptions_commandeId_idx" ON "receptions"("commandeId");

-- CreateIndex
CREATE INDEX "receptions_dateReception_idx" ON "receptions"("dateReception");

-- CreateIndex
CREATE INDEX "lignes_reception_receptionId_idx" ON "lignes_reception"("receptionId");

-- CreateIndex
CREATE INDEX "lignes_reception_articleStockId_idx" ON "lignes_reception"("articleStockId");

-- AddForeignKey
ALTER TABLE "bons_mouvement" ADD CONSTRAINT "bons_mouvement_lieuOrigineId_fkey" FOREIGN KEY ("lieuOrigineId") REFERENCES "lieux_stockage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bons_mouvement" ADD CONSTRAINT "bons_mouvement_lieuDestinationId_fkey" FOREIGN KEY ("lieuDestinationId") REFERENCES "lieux_stockage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_articleStockId_fkey" FOREIGN KEY ("articleStockId") REFERENCES "articles_stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_lieuStockageId_fkey" FOREIGN KEY ("lieuStockageId") REFERENCES "lieux_stockage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_bonMouvementId_fkey" FOREIGN KEY ("bonMouvementId") REFERENCES "bons_mouvement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventaires" ADD CONSTRAINT "inventaires_lieuStockageId_fkey" FOREIGN KEY ("lieuStockageId") REFERENCES "lieux_stockage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_inventaire" ADD CONSTRAINT "lignes_inventaire_inventaireId_fkey" FOREIGN KEY ("inventaireId") REFERENCES "inventaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_inventaire" ADD CONSTRAINT "lignes_inventaire_articleStockId_fkey" FOREIGN KEY ("articleStockId") REFERENCES "articles_stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releves_compteur" ADD CONSTRAINT "releves_compteur_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "materiel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releves_compteur" ADD CONSTRAINT "releves_compteur_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "materiel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_lieuId_fkey" FOREIGN KEY ("lieuId") REFERENCES "lieux_stockage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_inspection" ADD CONSTRAINT "lignes_inspection_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_inspection" ADD CONSTRAINT "lignes_inspection_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "points_inspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_reception" ADD CONSTRAINT "lignes_reception_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "receptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_reception" ADD CONSTRAINT "lignes_reception_articleStockId_fkey" FOREIGN KEY ("articleStockId") REFERENCES "articles_stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
