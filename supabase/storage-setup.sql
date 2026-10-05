-- ============================================================================
-- Configuration Supabase Storage pour le module Achats
-- Bucket : documents-achats
-- ============================================================================

-- ÉTAPE 1 : Créer le bucket (À faire via le Dashboard Supabase)
-- Nom : documents-achats
-- Public : OUI (pour que les URLs soient accessibles)
-- Taille max fichier : 10 MB
-- Types autorisés : PDF, Images, Word

-- ÉTAPE 2 : Policies RLS (À exécuter dans SQL Editor)

-- Policy 1 : Permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Utilisateurs authentifiés peuvent uploader des documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents-achats'
  AND (auth.uid())::text IS NOT NULL
);

-- Policy 2 : Permettre la lecture publique des documents
-- (Les documents d'achats doivent être consultables)
CREATE POLICY "Lecture publique des documents achats"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'documents-achats'
);

-- Policy 3 : Permettre la suppression aux utilisateurs authentifiés
-- (Pour gérer les erreurs d'upload)
CREATE POLICY "Utilisateurs authentifiés peuvent supprimer leurs documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents-achats'
  AND (auth.uid())::text IS NOT NULL
);

-- Policy 4 : Permettre la mise à jour (optionnel)
CREATE POLICY "Utilisateurs authentifiés peuvent mettre à jour"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents-achats'
  AND (auth.uid())::text IS NOT NULL
);

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Vérifier que le bucket existe
SELECT * FROM storage.buckets WHERE name = 'documents-achats';

-- Vérifier les policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%documents%';

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Le bucket doit être PUBLIC pour que getPublicUrl() fonctionne
-- 2. Les policies RLS contrôlent qui peut uploader/supprimer
-- 3. La lecture est publique car les devis doivent être accessibles
-- 4. Taille limite : 10 MB par fichier (configuré dans le code)
-- 5. Organisation : fichiers dans le dossier "devis/"

-- Formats acceptés :
-- - PDF : application/pdf
-- - Images : image/jpeg, image/jpg, image/png, image/webp
-- - Word : application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
