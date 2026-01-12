-- ============================================
-- Migration: Table User Profiles
-- Gestion des profils utilisateurs avec branding
-- ============================================

-- Créer la table user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT,
  role TEXT DEFAULT 'Analyste Senior',
  cabinet_nom TEXT,
  cabinet_logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour recherche rapide par user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- RLS pour user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Politique: chaque utilisateur ne peut voir/modifier que son propre profil
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
CREATE POLICY "Users can delete own profile"
ON user_profiles FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- VÉRIFICATION
-- ============================================
-- SELECT * FROM user_profiles;
