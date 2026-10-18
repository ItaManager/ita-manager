-- AlterTable
ALTER TABLE "demandes_ressource" ADD COLUMN     "lieuLivraison" TEXT;

-- AlterTable
ALTER TABLE "lignes_demande_ressource" ADD COLUMN     "operateurRequis" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "taches_demandes_ressource" (
    "tacheId" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,

    CONSTRAINT "taches_demandes_ressource_pkey" PRIMARY KEY ("tacheId","demandeId")
);

-- CreateIndex
CREATE INDEX "taches_demandes_ressource_demandeId_idx" ON "taches_demandes_ressource"("demandeId");

-- AddForeignKey
ALTER TABLE "taches_demandes_ressource" ADD CONSTRAINT "taches_demandes_ressource_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "taches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches_demandes_ressource" ADD CONSTRAINT "taches_demandes_ressource_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "demandes_ressource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
