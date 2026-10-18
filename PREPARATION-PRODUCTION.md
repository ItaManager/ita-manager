# PRÉPARATION PRODUCTION V1 — ITA MANAGER

**Date** : 18 octobre 2026
**Version** : 1.0.0
**Objectif** : Déploiement production modules fonctionnels

---

## 📦 Périmètre V1 (à déployer)

### Modules complets ✅
- **M0** : Socle (authentification, permissions, profils)
- **M1** : Organisation (directions, services, postes, organigramme)
- **M2** : Employés (fiches, contrats, documents)
- **M3** : Congés (demandes, validation N+1, contrôle RH, calendrier, soldes, équipe)
- **M13** : Logistique L1 (matériel, pièces, stocks de base)
- **M14** : Achats L1 (demandes, validation, BPU)
- **M15** : ITApay L1 (paiements employés Wave)
- **M15 L2** : Paiements Fournisseurs
- **M16 L2** : Carburant (3 circuits)
- **M17** : Compétences et taux journaliers

### Modules partiels ⚠️
- **M4** : Rémunération (grille salariale, dérogations - interface créée)
- **M5** : Projets (tableau, détails - backend créé)
- **M9** : Appels d'offres (interface basique)
- **M11** : Formations (données minimales)
- **M12** : Présences bureau (codes, bornes)

### Exclus de V1 (V2)
- ❌ Mon compte utilisateur
- ❌ M13 L2-L3 (logistique complète)
- ❌ QHSE
- ❌ Logs et audit complet
- ❌ M6-M7 (relevés, paie chantier - incomplets)

---

## ✅ Checklist pré-production

### 1. Nettoyage code ✓

- [x] Supprimer fichiers backup (`* 2.tsx`, `* 2.ts`)
- [ ] Supprimer `console.log()` en production
- [ ] Supprimer composants non utilisés
- [ ] Vérifier imports inutilisés
- [ ] Nettoyer commentaires TODO obsolètes

### 2. Données et seeds

- [ ] Supprimer données de test hardcodées
- [ ] Créer seed production minimal (admin uniquement)
- [ ] Documenter procédure seed production
- [ ] Vérifier contraintes unicité en base

### 3. Sécurité

- [ ] Vérifier toutes actions protégées (actionProtegee)
- [ ] Audit permissions par rôle
- [ ] Vérifier variables d'environnement (.env.example)
- [ ] Rotation secrets (JWT, DB passwords)
- [ ] Rate limiting API routes
- [ ] CORS configuration production

### 4. Design cohérence

- [ ] Audit couleurs (bleu ITA #1d186c)
- [ ] Uniformiser boutons (rounded-md, variants)
- [ ] Vérifier polices (sans-serif, tabular-nums)
- [ ] Cohérence badges statuts
- [ ] Responsive mobile critique
- [ ] Accessibilité (aria-labels, contraste)

### 5. Performance

- [ ] Optimiser requêtes N+1
- [ ] Index base de données
- [ ] Images optimisées
- [ ] Code splitting
- [ ] Cache strategy
- [ ] Lazy loading composants lourds

### 6. Tests

- [ ] Build production (`npm run build`)
- [ ] Tests E2E workflows critiques
- [ ] Tests navigation (403, 404)
- [ ] Tests permissions par rôle
- [ ] Tests sur données réelles

### 7. Documentation

- [ ] README.md à jour
- [ ] Guide déploiement
- [ ] Variables d'environnement
- [ ] Guide utilisateur par module
- [ ] Changelog V1

### 8. Déploiement

- [ ] Configuration Vercel
- [ ] Migration base production
- [ ] Seed admin production
- [ ] Tests post-déploiement
- [ ] Monitoring (Sentry, logs)
- [ ] Backup automatique

---

## 🎨 Standards design V1

### Couleurs

| Usage | Couleur | Variable |
|-------|---------|----------|
| Primaire (ITA) | #1d186c | `text-primary` |
| Fond | #ffffff | `bg-background` |
| Texte principal | #09090b | `text-foreground` |
| Texte secondaire | #71717a | `text-muted-foreground` |
| Bordures | #e4e4e7 | `border` |

### Badges statuts

| Statut | Couleur | Exemple |
|--------|---------|---------|
| Succès | `bg-emerald-100 text-emerald-800` | VALIDÉ, SOLDÉE |
| En cours | `bg-blue-100 text-blue-800` | EN_COURS, A_VALIDER |
| Attention | `bg-orange-100 text-orange-800` | EN_ATTENTE, J-7 |
| Erreur | `bg-red-100 text-red-800` | REFUSÉ, EN_RETARD |
| Neutre | `bg-gray-100 text-gray-800` | BROUILLON |

### Boutons

```tsx
// Primaire
<Button className="rounded-md">Action principale</Button>

// Secondaire
<Button variant="outline" className="rounded-md">Annuler</Button>

// Danger
<Button variant="destructive" className="rounded-md">Supprimer</Button>
```

### Typographie

```tsx
// Titres
<h1 className="text-2xl font-semibold">Titre principal</h1>
<h2 className="text-xl font-semibold">Sous-titre</h2>

// Montants
<span className="tabular-nums">1 234 567 F</span>

// Codes/références
<span className="font-mono text-xs">FAC-2026-001</span>
```

---

## 🐛 Bugs connus à corriger

### Haute priorité
1. [ ] Vérifier doublon permissions dans seed.ts
2. [ ] Fix upload fichiers (Storage Supabase)
3. [ ] Navigation breadcrumb manquante
4. [ ] Messages d'erreur en français partout

### Moyenne priorité
5. [ ] Pagination incohérente (10 vs 20 vs 50)
6. [ ] Filtres non persistés après navigation
7. [ ] Dates timezone UTC (affichage local)
8. [ ] Export CSV/PDF boutons désactivés

### Basse priorité
9. [ ] Tooltip delays incohérents
10. [ ] Loading skeletons manquants
11. [ ] Empty states non uniformes
12. [ ] Favicon ITA manquant

---

## ⚡ Optimisations prioritaires

### Base de données
```sql
-- Index manquants critiques
CREATE INDEX idx_employe_matricule ON employes(matricule);
CREATE INDEX idx_demande_paiement_statut ON demandes_paiement(statut);
CREATE INDEX idx_facture_fournisseur_statut ON factures_fournisseur(statut_facture);
CREATE INDEX idx_demande_conge_statut ON demandes_conge(statut);
```

### Code
- Remplacer `findMany()` par `findMany({ take: 100 })` partout
- Ajouter `select:` sur relations lourdes
- Lazy load modales (dynamic import)
- Memoize composants lourds (React.memo)

### Images
- Convertir PNG → WebP
- Lazy loading images
- Placeholder blur

---

## 📋 Procédure déploiement

### 1. Pré-déploiement
```bash
# Build local
npm run build

# Tests
npm run test (si existants)
npx tsc --noEmit

# Audit sécurité
npm audit --production
```

### 2. Migration base
```bash
# Backup production
pg_dump $DATABASE_URL > backup_pre_v1.sql

# Migration
npx prisma migrate deploy

# Seed admin uniquement
tsx scripts/seed-production-admin.ts
```

### 3. Déploiement Vercel
```bash
# Push branche main
git checkout main
git merge dev
git push origin main

# Vercel déploie automatiquement
# Vérifier : https://ita-manager.vercel.app
```

### 4. Post-déploiement
```bash
# Vérifier routes critiques
curl https://ita-manager.vercel.app/api/health

# Tests smoke
- Login admin
- Créer employé
- Créer demande congé
- Créer facture fournisseur
- Créer demande carburant
```

---

## 🔐 Variables d'environnement production

Créer `.env.production` (ne JAMAIS commit) :

```bash
# Database (Supabase production)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="..." # Générer nouveau : openssl rand -base64 32
NEXTAUTH_URL="https://ita-manager.vercel.app"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..." # NE JAMAIS exposer côté client

# Wave (production)
WAVE_API_KEY="..."
WAVE_SECRET_KEY="..."
WAVE_BUSINESS_ID="..."

# Email (Resend production)
RESEND_API_KEY="..."
RESEND_FROM_EMAIL="noreply@ita-manager.com"

# Monitoring
SENTRY_DSN="..." # Si utilisé
```

---

## 📊 Métriques succès V1

| Métrique | Cible | Mesure |
|----------|-------|--------|
| Temps chargement | < 3s | Lighthouse |
| Disponibilité | > 99% | Uptime monitoring |
| Utilisateurs actifs | 20+ | Analytics |
| Bugs critiques | 0 | Issue tracker |
| Score Lighthouse | > 90 | CI/CD |

---

## 🚀 Roadmap V2 (après V1)

1. **Mon compte utilisateur**
   - Profil personnel
   - Paramètres préférences
   - Historique activités

2. **M13 L2-L3 Logistique complète**
   - Stocks avancés
   - Inspections
   - Transport
   - Entretien

3. **QHSE**
   - Incidents
   - Audits
   - Formations sécurité
   - Équipements protection

4. **Logs et audit**
   - Journal complet
   - Traçabilité modifications
   - Rapports d'activité

5. **M6-M7 Paie chantier**
   - Relevés d'activité
   - Calcul paie journaliers
   - Génération bulletins

---

## ✅ Validation finale

Avant mise en production, vérifier :

- [ ] **Build réussit** (`npm run build`)
- [ ] **0 erreurs TypeScript** (`npx tsc --noEmit`)
- [ ] **Migrations appliquées** (production)
- [ ] **Variables env configurées** (Vercel)
- [ ] **Seed admin créé** (1 compte uniquement)
- [ ] **Tests smoke passent** (login, navigation)
- [ ] **Monitoring actif** (logs, erreurs)
- [ ] **Backup configuré** (automatique quotidien)
- [ ] **DNS configuré** (domaine custom si applicable)
- [ ] **SSL actif** (HTTPS)

---

**Document vivant - Mis à jour au fil de la préparation**
