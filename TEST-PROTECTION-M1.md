# Test de protection Server Actions — M1

**Critère de recette M0** : Une Server Action appelée directement par POST, sans permission, doit être refusée et tracée au journal.

## Prérequis

1. Application démarrée : `npm run dev`
2. Un utilisateur **sans** `organisation:modifier` dans la base
3. Navigateur en mode développeur (pour copier les cookies)

## Étapes du test

### 1. Créer un utilisateur de test sans permission

Exécuter ce script :

```bash
npx dotenv -e .env.dev -- npx tsx -e "
import { prisma } from '@/lib/db/prisma';
import { createClient } from '@/lib/supabase/server';

// Créer un compte Supabase
const supabase = createClient();
const { data: authData, error } = await supabase.auth.admin.createUser({
  email: 'test-sans-perm@ita.local',
  password: 'Test123456!',
  email_confirm: true,
});

if (error) {
  console.error('Erreur:', error);
  process.exit(1);
}

console.log('✅ Utilisateur créé:', authData.user.email);
console.log('   ID:', authData.user.id);
await prisma.\$disconnect();
"
```

### 2. Se connecter avec ce compte

1. Aller sur `http://localhost:3000/auth/connexion`
2. Se connecter avec `test-sans-perm@ita.local` / `Test123456!`
3. **Ignorer la page 2FA** si elle apparaît (pas de rôle à 2FA obligatoire)

### 3. Récupérer le cookie de session

Dans DevTools → Application → Cookies → `localhost:3000` :
- Copier la valeur de `sb-{project-ref}-auth-token` OU du cookie de session Supabase

### 4. Appeler la Server Action par POST direct

**URL de test** : `http://localhost:3000/api/organisation/creerPoste`

**ATTENTION** : Next.js Server Actions utilisent une route spéciale. La vraie route est :

```bash
# Récupérer l'ID de l'action depuis le code source
# La route Next.js Server Actions est : /_next/data/{buildId}/...
# OU via le endpoint direct si exposé

# Format Next.js 14+ Server Actions :
curl -X POST 'http://localhost:3000' \
  -H 'Content-Type: text/plain;charset=UTF-8' \
  -H 'Next-Action: {hash-de-l-action}' \
  -H 'Cookie: sb-xxx-auth-token={VOTRE_TOKEN}' \
  -d '[{
    "code": "TEST_POSTE",
    "libelle": "Poste de test malveillant",
    "niveau": "SUPPORT",
    "directionId": "{ID_DIRECTION_DG}",
    "serviceId": null,
    "reserveAdmin": false,
    "titulaireUnique": false,
    "ouvreDroitConges": true
  }]'
```

### 5. Résultat attendu

**Réponse HTTP** :
- Status : `403 Forbidden` OU erreur dans le payload de réponse
- Message : `Permission refusée` ou similaire

**Dans le journal d'audit** :

```sql
SELECT * FROM journal_evenements
WHERE action = 'REFUS_PERMISSION'
  AND "auteurNom" = 'test-sans-perm@ita.local'
ORDER BY "survenuLe" DESC
LIMIT 1;
```

Attendu :
```
entite    : Poste
action    : REFUS_PERMISSION
auteurNom : test-sans-perm@ita.local
details   : { permission: "organisation:modifier", action: "creerPoste" }
```

## Alternative : Test via un script

Créer un fichier de test qui simule l'appel :

```typescript
// test-protection.ts
import { creerPoste } from "@/lib/actions/organisation";

// Simuler une session sans permission
const sessionSansPermission = {
  userId: "{ID_USER_TEST}",
  email: "test-sans-perm@ita.local",
};

try {
  const result = await creerPoste(/* session simulée */, {
    code: "TEST_POSTE",
    libelle: "Poste de test",
    niveau: "SUPPORT",
    directionId: "{ID_DIRECTION}",
    serviceId: null,
    reserveAdmin: false,
    titulaireUnique: false,
    ouvreDroitConges: true,
  });

  console.error("❌ ÉCHEC DU TEST — L'action a abouti sans permission !");
  process.exit(1);
} catch (error) {
  if (error.message.includes("Permission")) {
    console.log("✅ PROTECTION VALIDE — Accès refusé");
  } else {
    console.error("❌ Erreur inattendue:", error);
    process.exit(1);
  }
}
```

## Validation

- [ ] L'appel POST direct échoue avec un refus explicite
- [ ] Le refus est tracé au `journal_evenements`
- [ ] L'action n'a **PAS** créé de poste en base
- [ ] Le message d'erreur mentionne la permission manquante

**Si l'un de ces critères échoue** : le guard `actionProtegee()` est défaillant et M0 n'est pas recetté.
