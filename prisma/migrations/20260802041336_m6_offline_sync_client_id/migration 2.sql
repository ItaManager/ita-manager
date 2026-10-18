-- AlterTable
ALTER TABLE "releves_activite" ADD COLUMN "clientIdOffline" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "releves_activite_clientIdOffline_key" ON "releves_activite"("clientIdOffline");
