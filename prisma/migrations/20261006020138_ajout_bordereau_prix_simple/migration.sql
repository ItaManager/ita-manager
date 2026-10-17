-- CreateTable
CREATE TABLE "ligne_bordereau_prix" (
    "id" TEXT NOT NULL,
    "lotNumero" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "quantite" DECIMAL(12,2) NOT NULL,
    "prixUnitaire" DECIMAL(12,2) NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,
    "creePar" TEXT NOT NULL,

    CONSTRAINT "ligne_bordereau_prix_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ligne_bordereau_prix_lotNumero_idx" ON "ligne_bordereau_prix"("lotNumero");
