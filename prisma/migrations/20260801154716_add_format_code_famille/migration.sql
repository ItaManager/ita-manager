-- Add formatCode and prochainNumero to familles_materiel (decision 1.1)
ALTER TABLE "familles_materiel"
  ADD COLUMN "formatCode" TEXT NOT NULL DEFAULT '{FAMILLE}{SEQ:3}',
  ADD COLUMN "prochainNumero" INTEGER NOT NULL DEFAULT 1;
