-- M13 Livraison 1 — Matériel et Pièces Administratives
-- Migration MANUELLE (corrigée pour éviter DROP COLUMN sur données)

-- =====================================================================
-- ÉTAPE 1 : Créer les nouveaux enums
-- =====================================================================

CREATE TYPE "TypeMateriel" AS ENUM (
  'VEHICULE_LEGER',
  'VEHICULE_LOURD',
  'ENGIN',
  'PETIT_MATERIEL',
  'CONTENEUR',
  'MOBILIER'
);

CREATE TYPE "StatutMateriel" AS ENUM (
  'DISPONIBLE',
  'EN_MISSION',
  'DEMOBILISE',
  'EN_MAINTENANCE',
  'EN_PANNE',
  'HORS_SERVICE',
  'REFORME'
);

CREATE TYPE "NatureLieu" AS ENUM (
  'SITE',
  'CHANTIER',
  'GARAGE',
  'MAGASIN',
  'BUREAU'
);

-- =====================================================================
-- ÉTAPE 2 : Renommer et enrichir CategorieMateriel → FamilleMateriel
-- =====================================================================

-- Renommer la table
ALTER TABLE "categories_materiel" RENAME TO "familles_materiel";

-- Ajouter nouvelles colonnes (libelleNormalise sera rempli au seed)
ALTER TABLE "familles_materiel"
  ADD COLUMN "libelleNormalise" TEXT,
  ADD COLUMN "type" "TypeMateriel",
  ADD COLUMN "actif" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "modifieLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Contraintes d'unicité (après remplissage au seed)
-- CREATE UNIQUE INDEX "familles_materiel_libelleNormalise_key" ON "familles_materiel"("libelleNormalise");

-- =====================================================================
-- ÉTAPE 3 : Créer LieuStockage (AVANT ajout lieuBaseId dans materiel)
-- =====================================================================

CREATE TABLE "lieux_stockage" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "nature" "NatureLieu" NOT NULL,
    "projetId" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lieux_stockage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lieux_stockage_libelle_key" ON "lieux_stockage"("libelle");
CREATE INDEX "lieux_stockage_nature_idx" ON "lieux_stockage"("nature");

-- FK vers projets (si nature=CHANTIER)
ALTER TABLE "lieux_stockage"
  ADD CONSTRAINT "lieux_stockage_projetId_fkey"
  FOREIGN KEY ("projetId") REFERENCES "projets"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- ÉTAPE 4 : Créer TypePieceAdministrative
-- =====================================================================

CREATE TABLE "types_piece_administrative" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "libelleNormalise" TEXT NOT NULL,
    "periodiciteMois" INTEGER,
    "delaiAlerteJours" INTEGER NOT NULL DEFAULT 30,
    "typesMateriel" TEXT NOT NULL DEFAULT '[]',
    "bloquante" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordreAffichage" INTEGER NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "types_piece_administrative_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "types_piece_administrative_libelle_key"
  ON "types_piece_administrative"("libelle");
CREATE UNIQUE INDEX "types_piece_administrative_libelleNormalise_key"
  ON "types_piece_administrative"("libelleNormalise");

-- =====================================================================
-- ÉTAPE 5 : Transformer materiel (RENAME au lieu de DROP)
-- =====================================================================

-- Supprimer ancienne FK et index AVANT renommage
ALTER TABLE "materiel" DROP CONSTRAINT "materiel_categorieId_fkey";
DROP INDEX "materiel_categorieId_idx";
DROP INDEX "materiel_code_key";
DROP INDEX "materiel_etat_idx";

-- Renommer colonnes (préserve données si base non vide)
ALTER TABLE "materiel" RENAME COLUMN "code" TO "codeIta";
ALTER TABLE "materiel" RENAME COLUMN "libelle" TO "designation";
ALTER TABLE "materiel" RENAME COLUMN "categorieId" TO "familleId";

-- Ajouter colonne statut et mapper depuis etat
ALTER TABLE "materiel" ADD COLUMN "statut" "StatutMateriel";

-- Mapping EN_SERVICE → EN_MISSION si affectation active, sinon DISPONIBLE
UPDATE "materiel" m SET "statut" =
  CASE
    WHEN m."etat" = 'EN_SERVICE' AND EXISTS (
      SELECT 1 FROM "affectations_materiel" a
      WHERE a."materielId" = m."id"
        AND a."dateDebut" <= CURRENT_DATE
        AND a."dateFin" >= CURRENT_DATE
    ) THEN 'EN_MISSION'::"StatutMateriel"
    WHEN m."etat" = 'EN_SERVICE'     THEN 'DISPONIBLE'::"StatutMateriel"
    WHEN m."etat" = 'EN_PANNE'       THEN 'EN_PANNE'::"StatutMateriel"
    WHEN m."etat" = 'EN_MAINTENANCE' THEN 'EN_MAINTENANCE'::"StatutMateriel"
    WHEN m."etat" = 'REFORME'        THEN 'REFORME'::"StatutMateriel"
  END;

-- Rendre statut NOT NULL après migration données
ALTER TABLE "materiel" ALTER COLUMN "statut" SET NOT NULL;
ALTER TABLE "materiel" ALTER COLUMN "statut" SET DEFAULT 'DISPONIBLE';

-- Supprimer ancienne colonne etat et son enum
ALTER TABLE "materiel" DROP COLUMN "etat";
DROP TYPE "EtatMateriel";

-- Ajouter nouvelles colonnes M13 L1
ALTER TABLE "materiel"
  ADD COLUMN "numeroParcAncien" TEXT,
  ADD COLUMN "codeLong" TEXT,
  ADD COLUMN "type" "TypeMateriel",  -- Sera rempli au seed avec mapping
  ADD COLUMN "numeroSerie" TEXT,
  ADD COLUMN "dateAcquisition" DATE,
  ADD COLUMN "coutAcquisition" DECIMAL(12,0),
  ADD COLUMN "lieuBaseId" TEXT;  -- Nullable : complétude progressive

-- Nouveaux index et contraintes
CREATE UNIQUE INDEX "materiel_codeIta_key" ON "materiel"("codeIta");
CREATE UNIQUE INDEX "materiel_numeroParcAncien_key" ON "materiel"("numeroParcAncien");
CREATE UNIQUE INDEX "materiel_codeLong_key" ON "materiel"("codeLong");
CREATE UNIQUE INDEX "materiel_numeroSerie_key" ON "materiel"("numeroSerie");
CREATE INDEX "materiel_type_idx" ON "materiel"("type");
CREATE INDEX "materiel_familleId_idx" ON "materiel"("familleId");
CREATE INDEX "materiel_lieuBaseId_idx" ON "materiel"("lieuBaseId");
CREATE INDEX "materiel_statut_idx" ON "materiel"("statut");

-- Recréer FK vers familles_materiel (nouveau nom)
ALTER TABLE "materiel"
  ADD CONSTRAINT "materiel_familleId_fkey"
  FOREIGN KEY ("familleId") REFERENCES "familles_materiel"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ajouter FK vers lieux_stockage (nullable, pas de CASCADE)
ALTER TABLE "materiel"
  ADD CONSTRAINT "materiel_lieuBaseId_fkey"
  FOREIGN KEY ("lieuBaseId") REFERENCES "lieux_stockage"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- =====================================================================
-- ÉTAPE 6 : Créer PieceAdministrative
-- =====================================================================

CREATE TABLE "pieces_administratives" (
    "id" TEXT NOT NULL,
    "materielId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "numero" TEXT,
    "emetteur" TEXT,
    "dateEdition" DATE NOT NULL,
    "dateExpiration" DATE NOT NULL,
    "montant" DECIMAL(12,0),
    "fichierId" TEXT,
    "remplaceId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pieces_administratives_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pieces_administratives_remplaceId_key"
  ON "pieces_administratives"("remplaceId");
CREATE INDEX "pieces_administratives_materielId_dateExpiration_idx"
  ON "pieces_administratives"("materielId", "dateExpiration");
CREATE INDEX "pieces_administratives_typeId_idx"
  ON "pieces_administratives"("typeId");

-- FK vers materiel (CASCADE si matériel supprimé)
ALTER TABLE "pieces_administratives"
  ADD CONSTRAINT "pieces_administratives_materielId_fkey"
  FOREIGN KEY ("materielId") REFERENCES "materiel"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- FK vers type de pièce (RESTRICT)
ALTER TABLE "pieces_administratives"
  ADD CONSTRAINT "pieces_administratives_typeId_fkey"
  FOREIGN KEY ("typeId") REFERENCES "types_piece_administrative"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- FK renouvellement (chaîne historique)
ALTER TABLE "pieces_administratives"
  ADD CONSTRAINT "pieces_administratives_remplaceId_fkey"
  FOREIGN KEY ("remplaceId") REFERENCES "pieces_administratives"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
