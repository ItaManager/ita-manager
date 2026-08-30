# Déploiement ITA Manager sur Vercel

## Prérequis

- ✅ Nouveau compte GitHub créé avec repo `ita-manager`
- ✅ Nouveau projet Supabase créé et migré
- ✅ `.env.prod` configuré et testé

---

## Étape 1 : Créer compte Vercel

1. Aller sur https://vercel.com/signup
2. **Sign up with GitHub** → autoriser avec votre nouveau compte GitHub
3. Confirmer l'email

---

## Étape 2 : Importer le projet

1. Dashboard Vercel → **Add New** → **Project**
2. **Import Git Repository** → Sélectionner `ita-manager`
3. **Configure Project** :
   - **Framework Preset** : Next.js (détecté automatiquement)
   - **Root Directory** : `./` (laisser par défaut)
   - **Build Command** : `npm run build` (détecté auto)
   - **Output Directory** : `.next` (détecté auto)
   - **Install Command** : `npm install` (détecté auto)

4. **Ne pas déployer encore** — cliquer sur "Environment Variables" d'abord

---

## Étape 3 : Variables d'environnement (CRITIQUE)

**⚠️ Copier TOUTES les variables depuis `.env.prod`**

### Groupe 1 : Supabase (OBLIGATOIRE)

```bash
DATABASE_URL=postgresql://postgres.XXXXX:...@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.XXXXX:...@aws-0-eu-west-3.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://XXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Groupe 2 : Email Resend

```bash
RESEND_API_KEY=re_123456789
EMAIL_FROM=noreply@ita-manager.ci
```

### Groupe 3 : Application

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.ita-manager.ci
```

### Groupe 4 : Sécurité

```bash
# Générer nouveau : openssl rand -base64 32
NEXTAUTH_SECRET=VOTRE_SECRET_GENERE
```

### Groupe 5 : Cloudflare (si utilisé)

```bash
CLOUDFLARE_API_TOKEN=votre_token
CLOUDFLARE_ZONE_ID=votre_zone_id
```

**Pour chaque variable** :
- Coller **Name** et **Value**
- Sélectionner environnements : **Production**, **Preview**, **Development**
- Cliquer **Add**

---

## Étape 4 : Déployer

1. Cliquer **Deploy**
2. Attendre 2-5 minutes (compilation Next.js + Turbopack)
3. ✅ Déploiement terminé → URL fournie : `https://ita-manager-xxx.vercel.app`

---

## Étape 5 : Configuration domaine personnalisé

### Option A : Domaine chez Infomaniak

1. Vercel → Project Settings → **Domains**
2. Ajouter : `app.ita-manager.ci`
3. Vercel donne un enregistrement DNS :
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

4. Aller sur Infomaniak → DNS → Ajouter cet enregistrement CNAME
5. Attendre propagation DNS (5-30 min)
6. Vercel détecte automatiquement → ✅ SSL activé

### Option B : Nouveau Cloudflare

1. Créer compte Cloudflare
2. Ajouter site : `ita-manager.ci`
3. Changer nameservers chez Infomaniak vers ceux de Cloudflare
4. Dans Cloudflare DNS → Ajouter CNAME :
   ```
   Type: CNAME
   Name: app
   Target: cname.vercel-dns.com
   Proxy: ON (orange cloud)
   ```

---

## Étape 6 : Vérifications post-déploiement

### Test 1 : Page connexion

```
https://app.ita-manager.ci/connexion
```

- [ ] Page charge sans erreur
- [ ] Design cohérent
- [ ] Formulaire visible

### Test 2 : Connexion super admin

```
Email: admin@ita-manager.ci
Password: (celui créé dans Supabase)
```

- [ ] Connexion réussie
- [ ] Redirection vers `/`
- [ ] Navigation visible

### Test 3 : Base de données

- [ ] Dashboard charge avec données
- [ ] Pas d'erreurs Prisma dans logs Vercel
- [ ] Compteurs navigation corrects

### Test 4 : Permissions

Tester accès à :
- [ ] `/missions` (accessible)
- [ ] `/admin/roles` (super admin)
- [ ] `/conges` (si profil employé lié)

---

## Logs et debugging

**Vercel Dashboard** → Project → **Deployments** → Dernier build

- **Build Logs** : Erreurs de compilation
- **Functions Logs** : Erreurs runtime (Server Actions, pages)
- **Real-time Logs** : Requêtes en direct

**Commandes utiles** :

```bash
# Tester build localement avec env prod
npx dotenv -e .env.prod -- npm run build

# Démarrer en mode production local
npx dotenv -e .env.prod -- npm start

# Logs Vercel CLI (optionnel)
npx vercel logs
```

---

## Checklist finale

- [ ] Supabase : projet créé, migrations appliquées, seed exécuté
- [ ] GitHub : code pushé sur nouveau repo
- [ ] Vercel : toutes variables d'environnement configurées
- [ ] Déploiement : réussi sans erreur
- [ ] DNS : domaine configuré et SSL actif
- [ ] Tests : connexion + navigation + permissions OK
- [ ] Super admin : compte créé et fonctionnel

---



## En cas d'erreur

### Erreur : "Prisma Client not generated"

**Solution** :
```bash
# Dans Vercel → Settings → General → Build & Development Settings
# Build Command:
npx prisma generate && npm run build
```

### Erreur : "Invalid environment variables"

**Vérifier** :
- Toutes les variables `NEXT_PUBLIC_*` commencent bien par ce préfixe
- `DATABASE_URL` contient `?pgbouncer=true&connection_limit=1`
- Pas d'espaces ni guillemets dans les valeurs

### Erreur : "Authentication failed"

**Vérifier** :
- `NEXT_PUBLIC_SUPABASE_URL` correspond bien au projet
- `SUPABASE_SERVICE_ROLE_KEY` est la clé **service_role**, pas anon
- Compte admin créé dans Supabase Auth

---

## Support

- **Vercel Docs** : https://vercel.com/docs
- **Supabase Docs** : https://supabase.com/docs
- **Next.js Deployment** : https://nextjs.org/docs/deployment

---

**Dernière mise à jour** : 2026-08-12
