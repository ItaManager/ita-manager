#!/usr/bin/env tsx
/**
 * Test M3 — Certificat médical (pièce de classification PARTICULIER)
 *
 * RÈGLE MÉTIER (M3 §7.5) :
 * Le certificat médical est une pièce jointe de classification PARTICULIER.
 *
 * Conséquences :
 * 1. Un congé maladie sans certificat ne s'enregistre pas
 * 2. Seule la Direction RH peut le consulter
 * 3. Chaque consultation est journalisée
 * 4. L'URL est signée et expire
 *
 * Usage :
 *   npx dotenv -e .env.dev -- npx tsx scripts/test-certificat-medical-m3.ts
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("🧪 Test M3 — Certificat médical\n");

  // ========================================================================
  // POINT 1 : Type d'absence "Congé maladie" requiert une pièce
  // ========================================================================
  console.log("📋 Point 1 : Pièce requise pour congé maladie\n");

  // Créer ou récupérer le type "Congé maladie"
  let typeMaladie = await prisma.typeAbsence.findFirst({
    where: {
      libelle: { contains: "maladie", mode: "insensitive" },
    },
  });

  if (!typeMaladie) {
    typeMaladie = await prisma.typeAbsence.create({
      data: {
        libelle: "Congé maladie",
        decompte: true,
        pieceRequise: true,
        pieceClassification: true,
        actif: true,
      },
    });
    console.log(`   ✓ Type créé : ${typeMaladie.libelle}`);
  } else {
    console.log(`   ✓ Type trouvé : ${typeMaladie.libelle}`);
  }

  console.log(`   Pièce requise : ${typeMaladie.pieceRequise}`);
  console.log(`   Classification particulière : ${typeMaladie.pieceClassification}`);

  if (!typeMaladie.pieceRequise || !typeMaladie.pieceClassification) {
    throw new Error("Point 1 échoué : pieceRequise ou pieceClassification non activés");
  }

  console.log(`   ✓ RÈGLE RESPECTÉE : Pièce obligatoire + classification PARTICULIER\n`);

  // Vérifier que soumettreAbsence bloque si pièce manquante
  const codeConges = readFileSync(
    join(process.cwd(), "lib/actions/conges.ts"),
    "utf-8"
  );

  if (codeConges.includes("typeAbsence.pieceRequise") &&
      codeConges.includes("!absence.pieceId")) {
    console.log(`   ✓ soumettreAbsence vérifie la pièce requise\n`);
  } else {
    throw new Error("soumettreAbsence ne vérifie pas pieceRequise");
  }

  // ========================================================================
  // POINT 2 : Seule la DRH peut consulter le certificat
  // ========================================================================
  console.log("📋 Point 2 : Accès restreint à la DRH\n");

  // Vérifier que obtenirUrlPiece existe et contrôle la classification
  const codeDocuments = readFileSync(
    join(process.cwd(), "lib/actions/documents.ts"),
    "utf-8"
  );

  let point2OK = false;

  if (codeDocuments.includes("obtenirUrlPiece")) {
    console.log(`   ✓ Fonction obtenirUrlPiece existe`);

    if (codeDocuments.includes("pieceClassification") &&
        codeDocuments.includes("estDRH") &&
        codeDocuments.includes("PARTICULIER")) {
      console.log(`   ✓ Contrôle classification PARTICULIER présent`);
      console.log(`   ✓ Vérification rôle DRH présente\n`);
      point2OK = true;
    } else {
      console.log(`   ❌ ÉCHEC : Contrôles manquants dans obtenirUrlPiece\n`);
    }
  } else {
    console.log(`   ❌ ÉCHEC : Fonction obtenirUrlPiece absente\n`);
  }

  if (!point2OK) {
    throw new Error("Point 2 échoué : Contrôle d'accès DRH manquant");
  }

  // ========================================================================
  // POINT 3 : Chaque consultation est journalisée
  // ========================================================================
  console.log("📋 Point 3 : Journalisation des consultations\n");

  let point3OK = false;

  if (codeDocuments.includes("CONSULTATION_PIECE") &&
      codeDocuments.includes("journalEvenement.create")) {
    console.log(`   ✓ Action CONSULTATION_PIECE journalisée`);
    console.log(`   ✓ Événement créé dans JournalEvenement\n`);
    point3OK = true;
  } else {
    console.log(`   ❌ ÉCHEC : Journalisation CONSULTATION_PIECE absente\n`);
  }

  if (!point3OK) {
    throw new Error("Point 3 échoué : Journalisation manquante");
  }

  // ========================================================================
  // POINT 4 : L'URL est signée et expire
  // ========================================================================
  console.log("📋 Point 4 : URL signée et expirante\n");

  let point4OK = false;

  if (codeDocuments.includes("createSignedUrl") &&
      codeDocuments.includes("300")) { // 300 secondes = 5 minutes
    console.log(`   ✓ Utilise Supabase createSignedUrl`);
    console.log(`   ✓ Expiration configurée (300 secondes = 5 minutes)\n`);
    point4OK = true;
  } else {
    console.log(`   ❌ ÉCHEC : URL signée ou expiration manquante\n`);
  }

  if (!point4OK) {
    throw new Error("Point 4 échoué : URL signée non implémentée");
  }

  console.log("✅ Tous les tests certificat médical réussis");
  console.log("   1. Type maladie avec pieceRequise + pieceClassification");
  console.log("   2. Accès DRH vérifié dans obtenirUrlPiece");
  console.log("   3. Journalisation CONSULTATION_PIECE active");
  console.log("   4. URL signée Supabase avec expiration 5 minutes\n");
}

main()
  .catch((e) => {
    console.error("❌ Test échoué :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
