-- CreateEnum
CREATE TYPE "TypeMainOeuvre" AS ENUM ('PERMANENT', 'JOURNALIER');

-- CreateEnum
CREATE TYPE "TypeContrat" AS ENUM ('CDI', 'CDD', 'INTERIM', 'STAGE');

-- CreateEnum
CREATE TYPE "SituationMatrimoniale" AS ENUM ('CELIBATAIRE', 'MARIE', 'DIVORCE', 'VEUF');

-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('MASCULIN', 'FEMININ');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('VIREMENT', 'WAVE');

-- CreateEnum
CREATE TYPE "StatutDerogation" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REFUSEE');

-- CreateTable
CREATE TABLE "nationalites" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "nationalites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employes" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "typeMainOeuvre" "TypeMainOeuvre" NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "sexe" "Sexe",
    "dateNaissance" DATE,
    "lieuNaissance" TEXT,
    "nationaliteId" TEXT,
    "situationMatrimoniale" "SituationMatrimoniale",
    "nombreEnfants" INTEGER DEFAULT 0,
    "numeroCnps" TEXT,
    "telephone" TEXT NOT NULL,
    "telephoneSecondaire" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "urgenceNom" TEXT,
    "urgenceTel" TEXT,
    "numeroWave" TEXT,
    "modePaiement" "ModePaiement",
    "rib" TEXT,
    "referenceInterne" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,
    "archiveLe" TIMESTAMP(3),

    CONSTRAINT "employes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affectations" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "posteId" TEXT NOT NULL,
    "superieurId" TEXT,
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affectations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrats" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "typeContrat" "TypeContrat" NOT NULL,
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE,
    "salaire" DECIMAL(10,2) NOT NULL,
    "signe" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contrats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avenants" (
    "id" TEXT NOT NULL,
    "contratId" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "dateEffet" DATE NOT NULL,
    "nouveauSalaire" DECIMAL(10,2),
    "nouvelleDateFin" DATE,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents_employes" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "typeDocument" TEXT NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "cheminStorage" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "estMedical" BOOLEAN NOT NULL DEFAULT false,
    "deposeParId" UUID NOT NULL,
    "deposeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_employes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "derogations_salariales" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "niveauMin" DECIMAL(10,2) NOT NULL,
    "niveauMax" DECIMAL(10,2) NOT NULL,
    "motif" TEXT NOT NULL,
    "statut" "StatutDerogation" NOT NULL DEFAULT 'EN_ATTENTE',
    "demandeParId" UUID NOT NULL,
    "demandeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decideParId" UUID,
    "decideLe" TIMESTAMP(3),
    "commentaire" TEXT,

    CONSTRAINT "derogations_salariales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nationalites_libelle_key" ON "nationalites"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "employes_matricule_key" ON "employes"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "employes_numeroCnps_key" ON "employes"("numeroCnps");

-- CreateIndex
CREATE INDEX "employes_matricule_idx" ON "employes"("matricule");

-- CreateIndex
CREATE INDEX "employes_typeMainOeuvre_idx" ON "employes"("typeMainOeuvre");

-- CreateIndex
CREATE INDEX "employes_nationaliteId_idx" ON "employes"("nationaliteId");

-- CreateIndex
CREATE INDEX "affectations_employeId_idx" ON "affectations"("employeId");

-- CreateIndex
CREATE INDEX "affectations_posteId_idx" ON "affectations"("posteId");

-- CreateIndex
CREATE INDEX "affectations_superieurId_idx" ON "affectations"("superieurId");

-- CreateIndex
CREATE INDEX "contrats_employeId_idx" ON "contrats"("employeId");

-- CreateIndex
CREATE INDEX "contrats_typeContrat_idx" ON "contrats"("typeContrat");

-- CreateIndex
CREATE INDEX "contrats_dateFin_idx" ON "contrats"("dateFin");

-- CreateIndex
CREATE INDEX "avenants_contratId_idx" ON "avenants"("contratId");

-- CreateIndex
CREATE INDEX "documents_employes_employeId_idx" ON "documents_employes"("employeId");

-- CreateIndex
CREATE INDEX "documents_employes_typeDocument_idx" ON "documents_employes"("typeDocument");

-- CreateIndex
CREATE INDEX "derogations_salariales_employeId_idx" ON "derogations_salariales"("employeId");

-- CreateIndex
CREATE INDEX "derogations_salariales_statut_idx" ON "derogations_salariales"("statut");

-- AddForeignKey
ALTER TABLE "employes" ADD CONSTRAINT "employes_nationaliteId_fkey" FOREIGN KEY ("nationaliteId") REFERENCES "nationalites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profils" ADD CONSTRAINT "profils_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_posteId_fkey" FOREIGN KEY ("posteId") REFERENCES "postes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_superieurId_fkey" FOREIGN KEY ("superieurId") REFERENCES "employes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrats" ADD CONSTRAINT "contrats_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avenants" ADD CONSTRAINT "avenants_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "contrats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents_employes" ADD CONSTRAINT "documents_employes_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "derogations_salariales" ADD CONSTRAINT "derogations_salariales_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
