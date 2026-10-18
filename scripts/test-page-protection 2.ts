/**
 * Test de protection d'accès aux pages via verifierAccesPage()
 *
 * Teste qu'un compte CC ne peut pas accéder à /paie
 * et que le refus est loggé dans le journal d'audit
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log("🔐 Test de protection des pages\n");

// Garde-fous
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Variables d'environnement Supabase manquantes");
  process.exit(1);
}

if (SUPABASE_URL.includes("ita-manager.supabase.co") && !SUPABASE_URL.includes("-dev")) {
  console.error("❌ PROTECTION : Ce script ne peut être exécuté qu'en développement");
  process.exit(1);
}

console.log("✅ Garde-fous validés : environnement de développement\n");

async function testPageProtection() {
  try {
    // 1. Créer le compte test CC s'il n'existe pas
    console.log("1️⃣  Préparation du compte test CC");

    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Vérifier si le compte existe
    const { data: existingUser } = await adminSupabase.auth.admin.listUsers();
    let userId: string;

    const testEmail = "test-cc@ita-sarl.local";
    const existingCC = existingUser?.users.find(u => u.email === testEmail);

    if (!existingCC) {
      const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email: testEmail,
        password: "TestRole2026!",
        email_confirm: true,
      });

      if (createError) {
        console.error("❌ Erreur création compte:", createError.message);
        return;
      }

      userId = newUser.user.id;

      // Créer le profil avec rôle CC
      await prisma.profil.create({
        data: {
          id: userId,
          email: testEmail,
          roles: {
            create: {
              roleId: (await prisma.role.findUniqueOrThrow({ where: { code: "CC" } })).id,
            },
          },
        },
      });

      console.log(`   ✅ Compte CC créé : ${testEmail}`);
    } else {
      userId = existingCC.id;
      console.log(`   ✅ Compte CC existant : ${testEmail}`);
    }

    // 2. S'authentifier avec le compte CC
    console.log("\n2️⃣  Authentification du compte CC");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: "TestRole2026!",
    });

    if (authError) {
      console.error("❌ Erreur authentification:", authError.message);
      return;
    }

    console.log("   ✅ Authentification réussie");
    const accessToken = authData.session.access_token;

    // 3. Vérifier les permissions du compte
    console.log("\n3️⃣  Vérification des permissions CC");

    const profil = await prisma.profil.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const permissions = profil?.roles.flatMap(pr =>
      pr.role.permissions.map(rp => rp.permission.code)
    ) || [];

    console.log(`   📋 Permissions du compte CC (${permissions.length}) :`);
    permissions.forEach(p => console.log(`      - ${p}`));

    const hasPayrollPermission = permissions.some(p =>
      p.startsWith("employe:donneesSensibles") ||
      p.startsWith("paie:")
    );

    console.log(`   ${hasPayrollPermission ? "❌" : "✅"} Accès Paie : ${hasPayrollPermission ? "OUI (erreur!)" : "NON (attendu)"}`);

    // 4. Supprimer les anciens événements de test
    console.log("\n4️⃣  Nettoyage des anciens événements de test");

    const { count: deletedCount } = await prisma.journalEvenement.deleteMany({
      where: {
        auteurId: userId,
        action: "ACCES_REFUSE",
        entite: "Page",
      },
    });

    console.log(`   🗑️  ${deletedCount} événement(s) supprimé(s)`);

    // 5. Tenter d'accéder à /paie via HTTP
    console.log("\n5️⃣  Test d'accès à la page /paie");
    console.log("   URL: http://localhost:3000/paie");
    console.log("   Method: GET");
    console.log(`   Cookie: sb-access-token=${accessToken.substring(0, 20)}...`);

    const response = await fetch("http://localhost:3000/paie", {
      method: "GET",
      headers: {
        "Cookie": `sb-access-token=${accessToken}; sb-refresh-token=${authData.session.refresh_token}`,
      },
      redirect: "manual", // Ne pas suivre les redirections
    });

    console.log(`\n   Status HTTP: ${response.status}`);
    console.log(`   Redirection: ${response.headers.get("location") || "Aucune"}`);

    if (response.status === 303 || response.status === 307) {
      const location = response.headers.get("location");
      if (location?.includes("/403")) {
        console.log("   ✅ Redirection vers /403 comme attendu");
      } else {
        console.log(`   ❌ Redirection vers ${location} au lieu de /403`);
      }
    } else if (response.status === 200) {
      console.log("   ❌ Page accessible (ne devrait pas l'être)");
    }

    // 6. Vérifier le journal d'audit
    console.log("\n6️⃣  Vérification du journal d'audit");

    // Attendre 1 seconde pour être sûr que l'événement est loggé
    await new Promise(resolve => setTimeout(resolve, 1000));

    const refusEvents = await prisma.journalEvenement.findMany({
      where: {
        auteurId: userId,
        action: "ACCES_REFUSE",
        entite: "Page",
      },
      orderBy: {
        survenuLe: "desc",
      },
      take: 1,
    });

    if (refusEvents.length === 0) {
      console.log("   ❌ Aucun événement ACCES_REFUSE trouvé dans le journal");
    } else {
      const event = refusEvents[0];
      console.log("   ✅ Événement de refus loggé :");
      console.log(`      - Date : ${event.survenuLe.toISOString()}`);
      console.log(`      - Entité : ${event.entite}`);
      console.log(`      - EntitéId : ${event.entiteId}`);
      console.log(`      - Auteur : ${event.auteurNom} (${event.auteurId})`);
      console.log(`      - Détails : ${JSON.stringify(event.details, null, 2)}`);
    }

    console.log("\n✅ Test terminé avec succès");

  } catch (error) {
    console.error("\n❌ Erreur durant le test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPageProtection();
