-- CreateEnum
CREATE TYPE "TypeNoteProjet" AS ENUM ('GENERALE', 'TECHNIQUE', 'QUALITE', 'SECURITE', 'ADMINISTRATIVE', 'REUNION');

-- CreateTable
CREATE TABLE "notes_projets" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "type" "TypeNoteProjet" NOT NULL,
    "titre" TEXT,
    "contenu" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "epinglee" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notes_projets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notes_projets_projetId_creeLe_idx" ON "notes_projets"("projetId", "creeLe");

-- AddForeignKey
ALTER TABLE "notes_projets" ADD CONSTRAINT "notes_projets_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes_projets" ADD CONSTRAINT "notes_projets_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
