-- Migration: Ajout d'index pour optimiser les performances des requêtes employés

-- Index composé sur employes (archiveLe, typeMainOeuvre)
-- Optimise toutes les requêtes filtrant les employés actifs par type
CREATE INDEX IF NOT EXISTS "employes_archiveLe_typeMainOeuvre_idx"
ON "employes"("archiveLe", "typeMainOeuvre");

-- Index sur contrats.typeContrat pour filtrage rapide CDD/CDI/INTERIM
CREATE INDEX IF NOT EXISTS "contrats_typeContrat_idx"
ON "contrats"("typeContrat");

-- Index composé sur contrats (dateFin, typeContrat) pour contrats expirant
CREATE INDEX IF NOT EXISTS "contrats_dateFin_typeContrat_idx"
ON "contrats"("dateFin", "typeContrat")
WHERE "dateFin" IS NOT NULL;

-- Index sur affectations.dateFin pour trouver affectations actives (dateFin IS NULL)
CREATE INDEX IF NOT EXISTS "affectations_dateFin_idx"
ON "affectations"("dateFin");

-- Index sur profils.employeId pour jointure rapide profils ↔ employes
-- (normalement créé automatiquement par Prisma, mais on s'assure)
CREATE INDEX IF NOT EXISTS "profils_employeId_idx"
ON "profils"("employeId")
WHERE "employeId" IS NOT NULL;
