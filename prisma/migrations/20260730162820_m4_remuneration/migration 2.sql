-- CreateTable
CREATE TABLE "grilles_salariales" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'BROUILLON',
    "dateEffet" TIMESTAMP(3),
    "valideLe" TIMESTAMP(3),
    "validePar" UUID,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creePar" UUID NOT NULL,

    CONSTRAINT "grilles_salariales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "echelons_grille" (
    "id" TEXT NOT NULL,
    "grilleId" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "min" DECIMAL(12,0) NOT NULL,
    "med" DECIMAL(12,0) NOT NULL,
    "max" DECIMAL(12,0) NOT NULL,

    CONSTRAINT "echelons_grille_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grilles_salariales_version_key" ON "grilles_salariales"("version");

-- CreateIndex
CREATE UNIQUE INDEX "echelons_grille_grilleId_niveau_key" ON "echelons_grille"("grilleId", "niveau");

-- AddForeignKey
ALTER TABLE "echelons_grille" ADD CONSTRAINT "echelons_grille_grilleId_fkey" FOREIGN KEY ("grilleId") REFERENCES "grilles_salariales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
