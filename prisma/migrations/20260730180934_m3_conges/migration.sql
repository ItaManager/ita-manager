-- CreateEnum
CREATE TYPE "StatutAbsence" AS ENUM ('BROUILLON', 'ATTENTE_N1', 'ATTENTE_RH', 'VALIDEE', 'REFUSEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "TypeMouvementSolde" AS ENUM ('DOTATION', 'MAJORATION', 'REPORT', 'CONSOMMATION');

-- CreateTable
CREATE TABLE "types_absence" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "decompte" BOOLEAN NOT NULL DEFAULT true,
    "pieceRequise" BOOLEAN NOT NULL DEFAULT false,
    "pieceClassification" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "types_absence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absences" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "typeAbsenceId" TEXT NOT NULL,
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE NOT NULL,
    "nombreJours" DECIMAL(5,1) NOT NULL,
    "statut" "StatutAbsence" NOT NULL DEFAULT 'BROUILLON',
    "motif" TEXT,
    "superieurId" TEXT,
    "decisionN1" TEXT,
    "decisionN1Le" TIMESTAMP(3),
    "decisionN1ParId" UUID,
    "motifRefusN1" TEXT,
    "decisionRH" TEXT,
    "decisionRHLe" TIMESTAMP(3),
    "decisionRHParId" UUID,
    "motifRefusRH" TEXT,
    "pieceId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soumieLe" TIMESTAMP(3),
    "annuleeLe" TIMESTAMP(3),

    CONSTRAINT "absences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soldes_conges" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "exercice" INTEGER NOT NULL,
    "typeMouvement" "TypeMouvementSolde" NOT NULL,
    "jours" DECIMAL(5,1) NOT NULL,
    "absenceId" TEXT,
    "commentaire" TEXT,
    "enregistreLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enregistreParId" UUID NOT NULL,

    CONSTRAINT "soldes_conges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delegations" (
    "id" TEXT NOT NULL,
    "mandantId" TEXT NOT NULL,
    "delegataireId" TEXT NOT NULL,
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delegations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regles_conges" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "description" TEXT,
    "modifieLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieParId" UUID NOT NULL,

    CONSTRAINT "regles_conges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jours_feries" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "libelle" TEXT NOT NULL,
    "mobile" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jours_feries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "types_absence_libelle_key" ON "types_absence"("libelle");

-- CreateIndex
CREATE INDEX "absences_employeId_idx" ON "absences"("employeId");

-- CreateIndex
CREATE INDEX "absences_statut_idx" ON "absences"("statut");

-- CreateIndex
CREATE INDEX "absences_superieurId_idx" ON "absences"("superieurId");

-- CreateIndex
CREATE INDEX "soldes_conges_employeId_idx" ON "soldes_conges"("employeId");

-- CreateIndex
CREATE INDEX "soldes_conges_exercice_idx" ON "soldes_conges"("exercice");

-- CreateIndex
CREATE INDEX "delegations_mandantId_idx" ON "delegations"("mandantId");

-- CreateIndex
CREATE INDEX "delegations_delegataireId_idx" ON "delegations"("delegataireId");

-- CreateIndex
CREATE INDEX "delegations_actif_idx" ON "delegations"("actif");

-- CreateIndex
CREATE UNIQUE INDEX "regles_conges_cle_key" ON "regles_conges"("cle");

-- CreateIndex
CREATE INDEX "jours_feries_date_idx" ON "jours_feries"("date");

-- CreateIndex
CREATE UNIQUE INDEX "jours_feries_date_key" ON "jours_feries"("date");

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_typeAbsenceId_fkey" FOREIGN KEY ("typeAbsenceId") REFERENCES "types_absence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soldes_conges" ADD CONSTRAINT "soldes_conges_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_mandantId_fkey" FOREIGN KEY ("mandantId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_delegataireId_fkey" FOREIGN KEY ("delegataireId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
