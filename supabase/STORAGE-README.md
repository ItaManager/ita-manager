# Configuration Supabase Storage pour les Achats

## 📦 Bucket : `documents-achats`

Ce bucket stocke tous les documents liés aux demandes d'achat :
- Devis fournisseurs (PDF)
- Images de produits (JPG, PNG, WebP)
- Documents Word (DOC, DOCX)

---

## 🚀 Étapes de configuration

### 1. Créer le bucket via le Dashboard Supabase

1. Connectez-vous à https://supabase.com/dashboard
2. Sélectionnez votre projet : **ita-manager-dev**
3. Dans le menu de gauche, cliquez sur **Storage**
4. Cliquez sur **New bucket**
5. Paramètres :
   - **Name** : `documents-achats`
   - **Public bucket** : ✅ **OUI** (cochez la case)
   - **File size limit** : `10 MB`
   - **Allowed MIME types** : Laisser vide (géré dans le code)

6. Cliquez sur **Create bucket**

---

### 2. Configurer les policies RLS

1. Dans le menu Storage, cliquez sur **Policies**
2. Cliquez sur **New policy**
3. Ou utilisez le **SQL Editor** pour exécuter le script :

```bash
# Depuis le terminal
cat supabase/storage-setup.sql
```

4. Copiez/collez dans le **SQL Editor** de Supabase
5. Cliquez sur **Run**

---

### 3. Vérifier la configuration

Dans le SQL Editor, exécutez :

```sql
-- Vérifier le bucket
SELECT id, name, public FROM storage.buckets WHERE name = 'documents-achats';

-- Vérifier les policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%documents%';
```

**Résultat attendu** :
- 1 bucket nommé `documents-achats` avec `public = true`
- 4 policies : INSERT, SELECT, DELETE, UPDATE

---

## 🔐 Policies RLS configurées

| Policy | Rôle | Action | Description |
|--------|------|--------|-------------|
| Upload | `authenticated` | INSERT | Les utilisateurs connectés peuvent uploader |
| Lecture | `public` | SELECT | Tout le monde peut lire les documents |
| Suppression | `authenticated` | DELETE | Les utilisateurs connectés peuvent supprimer |
| Mise à jour | `authenticated` | UPDATE | Les utilisateurs connectés peuvent modifier |

---

## 📂 Organisation des fichiers

```
documents-achats/
└── devis/
    ├── 1728123456789-abc123def.pdf
    ├── 1728123457890-xyz789ghi.jpg
    └── 1728123458901-mno456pqr.docx
```

**Format des noms** : `{timestamp}-{random}.{extension}`

---

## 🔗 URLs générées

Les URLs publiques ont le format :

```
https://[PROJECT_REF].supabase.co/storage/v1/object/public/documents-achats/devis/[FILENAME]
```

Exemple :
```
https://abcdefghijklmnop.supabase.co/storage/v1/object/public/documents-achats/devis/1728123456789-abc123def.pdf
```

---

## ✅ Test de la configuration

### Via le Dashboard

1. Allez dans **Storage** > **documents-achats**
2. Cliquez sur **Upload file**
3. Uploadez un fichier de test
4. Cliquez sur le fichier uploadé
5. Copiez l'**URL publique**
6. Ouvrez l'URL dans un nouvel onglet → Le fichier doit s'afficher

### Via l'application

1. Lancez l'application : `npm run dev`
2. Allez dans **Achats**
3. Ouvrez une demande d'achat
4. Cliquez sur **Instruire** pour un article
5. Uploadez un document
6. Vérifiez le toast de succès
7. Vérifiez dans Supabase Storage que le fichier apparaît

---

## 🐛 Dépannage

### Erreur : "Bucket not found"

**Cause** : Le bucket n'existe pas ou n'est pas nommé correctement

**Solution** :
```sql
SELECT name FROM storage.buckets;
```
Vérifiez que `documents-achats` apparaît

---

### Erreur : "Access denied"

**Cause** : Les policies RLS ne sont pas configurées

**Solution** : Exécutez le script `storage-setup.sql` dans le SQL Editor

---

### Erreur : "URL not public"

**Cause** : Le bucket n'est pas public

**Solution** :
```sql
UPDATE storage.buckets
SET public = true
WHERE name = 'documents-achats';
```

---

### Upload lent

**Cause** : Fichier trop volumineux ou connexion lente

**Solution** :
- Vérifiez la taille (max 10 MB)
- Compressez les PDFs si possible
- Réduisez la résolution des images

---

## 💰 Limites du plan gratuit

| Ressource | Limite gratuite |
|-----------|-----------------|
| Stockage | 1 GB |
| Transfert | 2 GB/mois |
| Fichiers | Illimité |

**Estimation pour ITA Manager** :
- Document moyen : 200 KB
- 20 demandes/mois × 3 documents = 60 uploads/mois
- 60 × 200 KB = **12 MB/mois**
- **Durée avant saturation** : ~80 mois (6-7 ans)

---

## 📚 Références

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)

---

## 🔄 Migration depuis Cloudflare R2 (si nécessaire)

Si vous aviez déjà des fichiers sur R2 :

```bash
# 1. Télécharger depuis R2
# 2. Uploader vers Supabase via le Dashboard
# 3. Mettre à jour les URLs dans la base de données

UPDATE lignes_achat
SET documentsDevis = jsonb_set(
  documentsDevis::jsonb,
  '{0,url}',
  '"https://nouvelle-url-supabase.com"'::jsonb
)
WHERE documentsDevis IS NOT NULL;
```

---

## ✨ Prochaines étapes

Après la configuration :

1. ✅ Tester l'upload d'un PDF
2. ✅ Tester l'upload d'une image
3. ✅ Vérifier l'accès public aux URLs
4. ✅ Tester l'instruction d'une demande complète
5. ✅ Vérifier le journal des événements

Tout est prêt ! 🎉
