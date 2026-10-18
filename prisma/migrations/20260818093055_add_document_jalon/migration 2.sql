-- CreateTable
CREATE TABLE "documents_jalons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jalonId" UUID NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "cheminStorage" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "typeMime" TEXT NOT NULL,
    "deposeParId" UUID NOT NULL,
    "deposeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_jalons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "documents_jalons_jalonId_key" ON "documents_jalons"("jalonId");

-- CreateIndex
CREATE UNIQUE INDEX "jalons_pieceId_key" ON "jalons"("pieceId");

-- AddForeignKey
ALTER TABLE "documents_jalons" ADD CONSTRAINT "documents_jalons_jalonId_fkey" FOREIGN KEY ("jalonId") REFERENCES "jalons"("pieceId") ON DELETE CASCADE ON UPDATE CASCADE;
