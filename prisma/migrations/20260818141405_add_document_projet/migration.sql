-- CreateEnum
CREATE TYPE "CategorieDocumentProjet" AS ENUM ('PLAN', 'CONTRAT', 'RAPPORT', 'DEVIS', 'AUTORISATION', 'AUTRE');

-- CreateTable
CREATE TABLE "documents_projets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projetId" TEXT NOT NULL,
    "categorie" "CategorieDocumentProjet" NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "cheminStorage" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "typeMime" TEXT NOT NULL,
    "deposeParId" UUID NOT NULL,
    "deposeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_projets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "documents_projets" ADD CONSTRAINT "documents_projets_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
