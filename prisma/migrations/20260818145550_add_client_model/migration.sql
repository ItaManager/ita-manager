-- AlterTable
ALTER TABLE "projets" ADD COLUMN     "clientId" TEXT;

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "contactPrincipal" TEXT,
    "fonctionContact" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "pays" TEXT DEFAULT 'Côte d''Ivoire',
    "numeroContribuable" TEXT,
    "notes" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creePar" UUID NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clients_nom_idx" ON "clients"("nom");

-- AddForeignKey
ALTER TABLE "projets" ADD CONSTRAINT "projets_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
