-- CreateTable
CREATE TABLE "bordereau_prix_unitaire" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "dateImport" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fichierSource" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bordereau_prix_unitaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lot_bpu" (
    "id" TEXT NOT NULL,
    "bpuId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "categorie" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lot_bpu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serie_bpu" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "sousTitre" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serie_bpu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ligne_bpu" (
    "id" TEXT NOT NULL,
    "serieId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "prixUnitaireHT" DECIMAL(15,2) NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ligne_bpu_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bordereau_prix_unitaire" ADD CONSTRAINT "bordereau_prix_unitaire_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lot_bpu" ADD CONSTRAINT "lot_bpu_bpuId_fkey" FOREIGN KEY ("bpuId") REFERENCES "bordereau_prix_unitaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serie_bpu" ADD CONSTRAINT "serie_bpu_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lot_bpu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ligne_bpu" ADD CONSTRAINT "ligne_bpu_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "serie_bpu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
