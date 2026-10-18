-- CreateEnum
CREATE TYPE "StatutAppelOffres" AS ENUM ('VEILLE', 'GO', 'ABANDONNE', 'CONSTITUTION', 'SOUMIS', 'GAGNE', 'PERDU');

-- CreateEnum
CREATE TYPE "TypeMarche" AS ENUM ('PUBLIC', 'PRIVE', 'INTERNATIONAL');

-- CreateTable
CREATE TABLE "appels_offres" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "maitreOuvrage" TEXT NOT NULL,
    "objet" TEXT NOT NULL,
    "montantEstime" DECIMAL(15,2),
    "dateLimiteDepot" TIMESTAMP(3) NOT NULL,
    "lieu" TEXT,
    "typeMarche" "TypeMarche" NOT NULL DEFAULT 'PUBLIC',
    "statut" "StatutAppelOffres" NOT NULL DEFAULT 'VEILLE',
    "goNoGoDecidePar" UUID,
    "goNoGoDecideLe" TIMESTAMP(3),
    "goNoGoMotif" TEXT,
    "montantAttribution" DECIMAL(15,2),
    "attributaire" TEXT,
    "dateNotification" TIMESTAMP(3),
    "creePar" UUID NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appels_offres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pieces_ao" (
    "id" TEXT NOT NULL,
    "appelOffresId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "obligatoire" BOOLEAN NOT NULL DEFAULT false,
    "fichierUrl" TEXT,
    "deposeLe" TIMESTAMP(3),

    CONSTRAINT "pieces_ao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concurrents_ao" (
    "id" TEXT NOT NULL,
    "appelOffresId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "montantSoumis" DECIMAL(15,2),
    "remarque" TEXT,

    CONSTRAINT "concurrents_ao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appels_offres_statut_idx" ON "appels_offres"("statut");

-- CreateIndex
CREATE INDEX "appels_offres_dateLimiteDepot_idx" ON "appels_offres"("dateLimiteDepot");

-- CreateIndex
CREATE INDEX "pieces_ao_appelOffresId_idx" ON "pieces_ao"("appelOffresId");

-- CreateIndex
CREATE INDEX "concurrents_ao_appelOffresId_idx" ON "concurrents_ao"("appelOffresId");

-- AddForeignKey
ALTER TABLE "pieces_ao" ADD CONSTRAINT "pieces_ao_appelOffresId_fkey" FOREIGN KEY ("appelOffresId") REFERENCES "appels_offres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concurrents_ao" ADD CONSTRAINT "concurrents_ao_appelOffresId_fkey" FOREIGN KEY ("appelOffresId") REFERENCES "appels_offres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
