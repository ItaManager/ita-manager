-- CreateEnum
CREATE TYPE "EtatMateriel" AS ENUM ('EN_SERVICE', 'EN_PANNE', 'EN_MAINTENANCE', 'REFORME');

-- CreateEnum
CREATE TYPE "NatureDemandeRessource" AS ENUM ('HUMAINE', 'MATERIELLE');

-- CreateEnum
CREATE TYPE "StatutDemandeRessource" AS ENUM ('BROUILLON', 'SOUMISE', 'VALIDEE_N1', 'VALIDEE_SERVICE', 'AFFECTEE', 'REFUSEE', 'ANNULEE');

-- CreateTable
CREATE TABLE "categories_materiel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "categories_materiel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "categorieId" TEXT NOT NULL,
    "marque" TEXT,
    "modele" TEXT,
    "immatriculation" TEXT,
    "anneeFabrication" INTEGER,
    "partageable" BOOLEAN NOT NULL DEFAULT false,
    "etat" "EtatMateriel" NOT NULL DEFAULT 'EN_SERVICE',
    "commentaire" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affectations_materiel" (
    "id" TEXT NOT NULL,
    "materielId" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE NOT NULL,
    "commentaire" TEXT,
    "affecteParId" UUID NOT NULL,
    "affecteLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affectations_materiel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demandes_ressource" (
    "id" TEXT NOT NULL,
    "nature" "NatureDemandeRessource" NOT NULL,
    "projetId" TEXT NOT NULL,
    "demandeurId" UUID NOT NULL,
    "demandeurNom" TEXT NOT NULL,
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE NOT NULL,
    "motif" TEXT NOT NULL,
    "statut" "StatutDemandeRessource" NOT NULL DEFAULT 'BROUILLON',
    "valideN1ParId" UUID,
    "valideN1Le" TIMESTAMP(3),
    "motifRefusN1" TEXT,
    "valideServiceParId" UUID,
    "valideServiceLe" TIMESTAMP(3),
    "motifRefusService" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demandes_ressource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_demande_ressource" (
    "id" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "competence" TEXT,
    "quantite" INTEGER,
    "materielId" TEXT,
    "commentaire" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lignes_demande_ressource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_materiel_code_key" ON "categories_materiel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "materiel_code_key" ON "materiel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "materiel_immatriculation_key" ON "materiel"("immatriculation");

-- CreateIndex
CREATE INDEX "materiel_categorieId_idx" ON "materiel"("categorieId");

-- CreateIndex
CREATE INDEX "materiel_etat_idx" ON "materiel"("etat");

-- CreateIndex
CREATE INDEX "affectations_materiel_materielId_idx" ON "affectations_materiel"("materielId");

-- CreateIndex
CREATE INDEX "affectations_materiel_projetId_idx" ON "affectations_materiel"("projetId");

-- CreateIndex
CREATE INDEX "affectations_materiel_dateDebut_idx" ON "affectations_materiel"("dateDebut");

-- CreateIndex
CREATE INDEX "affectations_materiel_dateFin_idx" ON "affectations_materiel"("dateFin");

-- CreateIndex
CREATE INDEX "demandes_ressource_projetId_idx" ON "demandes_ressource"("projetId");

-- CreateIndex
CREATE INDEX "demandes_ressource_nature_idx" ON "demandes_ressource"("nature");

-- CreateIndex
CREATE INDEX "demandes_ressource_statut_idx" ON "demandes_ressource"("statut");

-- CreateIndex
CREATE INDEX "lignes_demande_ressource_demandeId_idx" ON "lignes_demande_ressource"("demandeId");

-- CreateIndex
CREATE INDEX "lignes_demande_ressource_materielId_idx" ON "lignes_demande_ressource"("materielId");

-- AddForeignKey
ALTER TABLE "materiel" ADD CONSTRAINT "materiel_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "categories_materiel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations_materiel" ADD CONSTRAINT "affectations_materiel_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "materiel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations_materiel" ADD CONSTRAINT "affectations_materiel_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_ressource" ADD CONSTRAINT "demandes_ressource_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_demande_ressource" ADD CONSTRAINT "lignes_demande_ressource_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes_ressource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_demande_ressource" ADD CONSTRAINT "lignes_demande_ressource_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "materiel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
