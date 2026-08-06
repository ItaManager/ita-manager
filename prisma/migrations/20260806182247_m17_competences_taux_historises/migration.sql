-- M17 — Compétences et taux journaliers historisés
-- Architecture correcte : taux et affectations dans des tables séparées

-- 1. Supprimer l'ancienne table competences (architecture incorrecte)
DROP TABLE IF EXISTS "public"."competences" CASCADE;

-- 2. Créer l'enum CategorieCompetence
CREATE TYPE "public"."CategorieCompetence" AS ENUM ('BASE', 'QUALIFIE', 'COMPOSEE');

-- 3. Créer la nouvelle table Competence
CREATE TABLE "public"."competences" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "libelleNormalise" TEXT NOT NULL,
    "categorie" "public"."CategorieCompetence" NOT NULL,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "motifArchivage" TEXT,
    "creeParId" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competences_pkey" PRIMARY KEY ("id")
);

-- 4. Créer la table TauxJournalier
CREATE TABLE "public"."taux_journaliers" (
    "id" TEXT NOT NULL,
    "competenceId" TEXT NOT NULL,
    "montant" DECIMAL(12,0) NOT NULL,
    "dateEffet" DATE NOT NULL,
    "motif" TEXT,
    "definiParId" TEXT NOT NULL,
    "definiLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taux_journaliers_pkey" PRIMARY KEY ("id")
);

-- 5. Créer la table AffectationCompetence
CREATE TABLE "public"."affectations_competence" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "competenceId" TEXT NOT NULL,
    "dateEffet" DATE NOT NULL,
    "dateFin" DATE,
    "motif" TEXT,
    "assigneeParId" TEXT NOT NULL,
    "assigneeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affectations_competence_pkey" PRIMARY KEY ("id")
);

-- 6. Créer la table de jonction pour l'auto-relation Composition
CREATE TABLE "public"."_Composition" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- 7. Créer les index sur Competence
CREATE UNIQUE INDEX "competences_libelle_key" ON "public"."competences"("libelle");
CREATE UNIQUE INDEX "competences_libelleNormalise_key" ON "public"."competences"("libelleNormalise");
CREATE INDEX "competences_actif_categorie_idx" ON "public"."competences"("actif", "categorie");

-- 8. Créer les index et contraintes sur TauxJournalier
CREATE UNIQUE INDEX "taux_journaliers_competenceId_dateEffet_key" ON "public"."taux_journaliers"("competenceId", "dateEffet");
CREATE INDEX "taux_journaliers_competenceId_dateEffet_idx" ON "public"."taux_journaliers"("competenceId", "dateEffet");

-- 9. Créer les index sur AffectationCompetence
CREATE INDEX "affectations_competence_employeId_dateEffet_idx" ON "public"."affectations_competence"("employeId", "dateEffet");

-- 10. Créer les index sur _Composition
CREATE UNIQUE INDEX "_Composition_AB_unique" ON "public"."_Composition"("A", "B");
CREATE INDEX "_Composition_B_index" ON "public"."_Composition"("B");

-- 11. Ajouter les foreign keys
ALTER TABLE "public"."taux_journaliers" ADD CONSTRAINT "taux_journaliers_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "public"."competences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."affectations_competence" ADD CONSTRAINT "affectations_competence_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "public"."employes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."affectations_competence" ADD CONSTRAINT "affectations_competence_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "public"."competences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."_Composition" ADD CONSTRAINT "_Composition_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."competences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."_Composition" ADD CONSTRAINT "_Composition_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."competences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
