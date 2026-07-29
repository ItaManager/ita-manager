-- CreateTable
CREATE TABLE "profils" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "derniereConn" TIMESTAMP(3),
    "employeId" TEXT,
    "delegataireId" UUID,
    "delegationDebut" DATE,
    "delegationFin" DATE,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,
    "archiveLe" TIMESTAMP(3),

    CONSTRAINT "profils_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "systeme" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "domaine" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "profil_roles" (
    "profilId" UUID NOT NULL,
    "roleId" TEXT NOT NULL,
    "attribueLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profil_roles_pkey" PRIMARY KEY ("profilId","roleId")
);

-- CreateTable
CREATE TABLE "codes_secours_mfa" (
    "id" TEXT NOT NULL,
    "profilId" UUID NOT NULL,
    "codeHache" TEXT NOT NULL,
    "utiliseLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codes_secours_mfa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brouillons" (
    "id" TEXT NOT NULL,
    "profilId" UUID NOT NULL,
    "entite" TEXT NOT NULL,
    "entiteId" TEXT,
    "donnees" JSONB NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brouillons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametres" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "groupe" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "aide" TEXT,
    "modifieParId" TEXT,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parametres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_evenements" (
    "id" TEXT NOT NULL,
    "entite" TEXT NOT NULL,
    "entiteId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "auteurId" UUID,
    "auteurNom" TEXT NOT NULL,
    "details" JSONB,
    "commentaire" TEXT,
    "survenuLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_evenements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "destinataireId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lienEntite" TEXT,
    "lienEntiteId" TEXT,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "lueLe" TIMESTAMP(3),
    "emailEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "emailEnvoyeLe" TIMESTAMP(3),
    "emailResendId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profils_email_key" ON "profils"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profils_employeId_key" ON "profils"("employeId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_domaine_idx" ON "permissions"("domaine");

-- CreateIndex
CREATE INDEX "codes_secours_mfa_profilId_idx" ON "codes_secours_mfa"("profilId");

-- CreateIndex
CREATE INDEX "brouillons_modifieLe_idx" ON "brouillons"("modifieLe");

-- CreateIndex
CREATE UNIQUE INDEX "brouillons_profilId_entite_entiteId_key" ON "brouillons"("profilId", "entite", "entiteId");

-- CreateIndex
CREATE UNIQUE INDEX "parametres_cle_key" ON "parametres"("cle");

-- CreateIndex
CREATE INDEX "parametres_groupe_idx" ON "parametres"("groupe");

-- CreateIndex
CREATE INDEX "journal_evenements_entite_entiteId_idx" ON "journal_evenements"("entite", "entiteId");

-- CreateIndex
CREATE INDEX "journal_evenements_survenuLe_idx" ON "journal_evenements"("survenuLe");

-- CreateIndex
CREATE INDEX "notifications_destinataireId_lue_idx" ON "notifications"("destinataireId", "lue");

-- CreateIndex
CREATE INDEX "notifications_emailEnvoye_idx" ON "notifications"("emailEnvoye");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profil_roles" ADD CONSTRAINT "profil_roles_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "profils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profil_roles" ADD CONSTRAINT "profil_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codes_secours_mfa" ADD CONSTRAINT "codes_secours_mfa_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "profils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_evenements" ADD CONSTRAINT "journal_evenements_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "profils"("id") ON DELETE SET NULL ON UPDATE CASCADE;
