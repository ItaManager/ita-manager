-- CreateEnum
CREATE TYPE "ModePaiementCarburant" AS ENUM ('ESPECES', 'CARTE_BANCAIRE', 'BON_CARBURANT', 'VIREMENT', 'COMPTE_ENTREPRISE');

-- AlterTable
ALTER TABLE "distributions_carburant"
  -- Renommer quantite en litresAjoutes pour clarté
  RENAME COLUMN "quantite" TO "litresAjoutes";

-- AlterTable
ALTER TABLE "distributions_carburant"
  -- Ajouter quantite (litres demandés) - sera rempli avec litresAjoutes existants
  ADD COLUMN "quantite" DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Ajouter compteurPrecedent - valeur temporaire 0, sera calculé
  ADD COLUMN "compteurPrecedent" DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Ajouter kmParcourus - valeur temporaire 0, sera calculé
  ADD COLUMN "kmParcourus" DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Ajouter consommation - nullable
  ADD COLUMN "consommation" DECIMAL(6,2),

  -- Ajouter mode paiement et facture - nullable
  ADD COLUMN "modePaiement" "ModePaiementCarburant",
  ADD COLUMN "numeroFacture" TEXT;

-- Mettre à jour les valeurs par défaut
-- quantite = litresAjoutes (initialement identiques)
UPDATE "distributions_carburant" SET "quantite" = "litresAjoutes";

-- Calculer compteurPrecedent et kmParcourus pour données existantes
-- (Requête complexe - peut être fait manuellement si nécessaire)
-- Pour l'instant on laisse à 0, sera recalculé au besoin

-- Supprimer les defaults temporaires
ALTER TABLE "distributions_carburant" ALTER COLUMN "quantite" DROP DEFAULT;
ALTER TABLE "distributions_carburant" ALTER COLUMN "compteurPrecedent" DROP DEFAULT;
ALTER TABLE "distributions_carburant" ALTER COLUMN "kmParcourus" DROP DEFAULT;
