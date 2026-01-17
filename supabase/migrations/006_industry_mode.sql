-- ============================================================================
-- MIGRATION 006: Contexte Métier - Préférences Utilisateur
-- ============================================================================
-- Ajoute la colonne industry_mode pour persister le choix de contexte métier

-- Ajouter la colonne industry_mode à user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS industry_mode VARCHAR(50) DEFAULT 'ARTISAN_CEE' CHECK (
  industry_mode IN ('ARTISAN_CEE', 'VITICULTURE', 'PAYSAGISTE_DEMOLITION')
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_user_profiles_industry_mode ON user_profiles(industry_mode);

-- Commentaire
COMMENT ON COLUMN user_profiles.industry_mode IS 'Contexte métier préféré: ARTISAN_CEE, VITICULTURE, PAYSAGISTE_DEMOLITION';

-- ============================================================================
-- POLITIQUE RLS (si pas déjà existante)
-- ============================================================================

-- Permettre aux utilisateurs de lire/modifier leur propre profil
DO $$
BEGIN
  -- Vérifie si la politique existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON user_profiles
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile" ON user_profiles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON user_profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
