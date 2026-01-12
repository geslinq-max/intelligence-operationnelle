-- ============================================
-- Migration: Configuration Supabase Storage
-- Bucket client-documents avec RLS strict
-- ============================================

-- ============================================
-- ÉTAPE 1: Créer le bucket client-documents
-- ============================================

-- Note: Cette commande doit être exécutée via l'API Supabase ou le Dashboard
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'client-documents',
--   'client-documents',
--   false,
--   10485760, -- 10 Mo en bytes
--   ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
-- );

-- ============================================
-- ÉTAPE 2: Politiques RLS pour le Storage
-- Chaque utilisateur ne peut accéder qu'à son dossier
-- Structure: client-documents/{user_id}/fichier.pdf
-- ============================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Politique INSERT: Upload uniquement dans son propre dossier
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique SELECT: Lecture uniquement de ses propres fichiers
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique UPDATE: Modification uniquement de ses propres fichiers
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique DELETE: Suppression uniquement de ses propres fichiers
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- ÉTAPE 3: Ajouter colonne document_url aux tables
-- ============================================

-- Table rapports_scout: pour stocker le lien du document joint à l'analyse
ALTER TABLE rapports_scout 
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Table entreprises: pour stocker un document principal de l'entreprise
ALTER TABLE entreprises 
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_rapports_document ON rapports_scout(document_url) WHERE document_url IS NOT NULL;

-- ============================================
-- VÉRIFICATION (à exécuter après)
-- ============================================
-- SELECT * FROM storage.buckets WHERE id = 'client-documents';
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
