-- CreateTable
CREATE TABLE "projets" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'BROUILLON',
    "maitreOuvrage" TEXT,
    "montantMarche" DECIMAL(15,2),
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "cyclePaie" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creePar" UUID NOT NULL,

    CONSTRAINT "projets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taches" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "avancementPlanifie" INTEGER NOT NULL DEFAULT 0,
    "avancementConstate" INTEGER,
    "predecesseurId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jalons" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "datePrevisionnelle" TIMESTAMP(3) NOT NULL,
    "typeValidateur" TEXT NOT NULL,
    "validateurExterne" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'ATTENTE',
    "pieceId" UUID,
    "valideLe" TIMESTAMP(3),
    "validePar" UUID,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jalons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affectations_chantier" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "roleFonctionnel" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creePar" UUID NOT NULL,

    CONSTRAINT "affectations_chantier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lieux_livraison" (
    "id" TEXT NOT NULL,
    "projetId" TEXT,
    "libelle" TEXT NOT NULL,
    "adresse" TEXT,
    "coordonnees" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creePar" UUID NOT NULL,

    CONSTRAINT "lieux_livraison_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projets_code_key" ON "projets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "lieux_livraison_projetId_key" ON "lieux_livraison"("projetId");

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_predecesseurId_fkey" FOREIGN KEY ("predecesseurId") REFERENCES "taches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jalons" ADD CONSTRAINT "jalons_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations_chantier" ADD CONSTRAINT "affectations_chantier_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations_chantier" ADD CONSTRAINT "affectations_chantier_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lieux_livraison" ADD CONSTRAINT "lieux_livraison_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
