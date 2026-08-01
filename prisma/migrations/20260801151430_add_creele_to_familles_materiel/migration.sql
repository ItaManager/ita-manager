-- Add missing creeLe column to familles_materiel
ALTER TABLE "familles_materiel" ADD COLUMN "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add missing unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "familles_materiel_libelle_key" ON "familles_materiel"("libelle");
CREATE UNIQUE INDEX IF NOT EXISTS "familles_materiel_libelleNormalise_key" ON "familles_materiel"("libelleNormalise");
