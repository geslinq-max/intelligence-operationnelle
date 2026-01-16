-- ============================================================================
-- MIGRATION: Sécurisation des rôles - ARTISAN par défaut
-- CAPITAL ÉNERGIE - Janvier 2026
-- ============================================================================
-- 
-- Ce script garantit que :
-- 1. Tout nouvel utilisateur reçoit le rôle 'artisan' (USER limité)
-- 2. Seul l'email FOUNDER peut avoir le rôle 'fondateur'
-- 3. Les rôles ne peuvent pas être modifiés sans autorisation admin
--
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CRÉER LA TABLE user_profiles SI ELLE N'EXISTE PAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT,
  nom TEXT,
  cabinet_nom TEXT,
  role TEXT DEFAULT 'artisan' CHECK (role IN ('fondateur', 'manager', 'partenaire', 'artisan')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- ============================================================================
-- 2. FONCTION TRIGGER: Créer profil avec rôle ARTISAN à l'inscription
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  founder_email TEXT := COALESCE(current_setting('app.founder_email', true), 'fondateur@capital-energie.fr');
  user_role TEXT := 'artisan';
BEGIN
  -- 🔒 SÉCURITÉ: Seul l'email fondateur obtient le rôle fondateur
  IF LOWER(TRIM(NEW.email)) = LOWER(TRIM(founder_email)) THEN
    user_role := 'fondateur';
  END IF;
  
  -- Créer le profil utilisateur
  INSERT INTO public.user_profiles (user_id, email, role, created_at)
  VALUES (NEW.id, LOWER(TRIM(NEW.email)), user_role, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. ATTACHER LE TRIGGER À LA TABLE auth.users
-- ============================================================================

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le nouveau trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. FONCTION DE PROTECTION: Empêcher modification non autorisée des rôles
-- ============================================================================

CREATE OR REPLACE FUNCTION public.protect_role_update()
RETURNS TRIGGER AS $$
DECLARE
  founder_email TEXT := COALESCE(current_setting('app.founder_email', true), 'fondateur@capital-energie.fr');
  current_user_email TEXT;
BEGIN
  -- Récupérer l'email de l'utilisateur qui fait la modification
  SELECT email INTO current_user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- 🔒 Si le rôle change, vérifier que c'est le fondateur qui fait le changement
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF LOWER(TRIM(COALESCE(current_user_email, ''))) != LOWER(TRIM(founder_email)) THEN
      RAISE EXCEPTION 'Seul le fondateur peut modifier les rôles utilisateur';
    END IF;
    
    -- 🔒 Empêcher de s'auto-attribuer le rôle fondateur
    IF NEW.role = 'fondateur' AND LOWER(TRIM(NEW.email)) != LOWER(TRIM(founder_email)) THEN
      RAISE EXCEPTION 'Le rôle fondateur est réservé à l''email fondateur uniquement';
    END IF;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. ATTACHER LE TRIGGER DE PROTECTION
-- ============================================================================

DROP TRIGGER IF EXISTS protect_role_changes ON public.user_profiles;

CREATE TRIGGER protect_role_changes
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_role_update();

-- ============================================================================
-- 6. POLITIQUES RLS (Row Level Security)
-- ============================================================================

-- Activer RLS sur la table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Politique: Un utilisateur peut voir son propre profil
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Un utilisateur peut modifier son propre profil (sauf le rôle)
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique: Insertion automatique via trigger uniquement
DROP POLICY IF EXISTS "System can insert profiles" ON public.user_profiles;
CREATE POLICY "System can insert profiles" ON public.user_profiles
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 7. NETTOYAGE: Forcer tous les profils existants au rôle ARTISAN
--    SAUF l'email fondateur
-- ============================================================================

-- ⚠️ ATTENTION: Cette requête reset tous les rôles sauf le fondateur
-- Décommenter pour exécuter si nécessaire:

-- UPDATE public.user_profiles
-- SET role = CASE 
--   WHEN LOWER(TRIM(email)) = LOWER(TRIM(COALESCE(current_setting('app.founder_email', true), 'fondateur@capital-energie.fr')))
--   THEN 'fondateur'
--   ELSE 'artisan'
-- END,
-- updated_at = NOW();

-- ============================================================================
-- 8. VÉRIFICATION: Afficher les profils actuels
-- ============================================================================

SELECT 
  email, 
  role, 
  created_at,
  CASE 
    WHEN role = 'fondateur' THEN '👑 Fondateur'
    WHEN role = 'manager' THEN '🎯 Manager'
    WHEN role = 'partenaire' THEN '💼 Partenaire'
    ELSE '⚡ Artisan (Client)'
  END as role_label
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
