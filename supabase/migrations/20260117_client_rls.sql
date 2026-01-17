-- ============================================================================
-- Migration: Rôle CLIENT et Politiques RLS
-- Date: 2026-01-17
-- Description: Ajout du rôle CLIENT avec isolation des données par utilisateur
-- ============================================================================

-- 1. Ajouter la colonne role aux profils utilisateurs (si elle n'existe pas)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'artisan' CHECK (role IN ('admin', 'artisan', 'client'));

-- 2. Ajouter la colonne industry pour les clients
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS industry TEXT CHECK (industry IN ('CEE', 'PAYSAGISTE', 'VITICULTEUR'));

-- 3. Ajouter la colonne user_id aux tables métier pour le RLS

-- Table des dossiers CEE
ALTER TABLE public.dossiers_cee 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Table des BSD
ALTER TABLE public.bsd 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Table des traitements phyto
ALTER TABLE public.traitements_phyto 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- ============================================================================
-- POLITIQUES RLS - Isolation des données clients
-- ============================================================================

-- Activer RLS sur les tables
ALTER TABLE public.dossiers_cee ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bsd ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traitements_phyto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view own dossiers" ON public.dossiers_cee;
DROP POLICY IF EXISTS "Users can insert own dossiers" ON public.dossiers_cee;
DROP POLICY IF EXISTS "Users can update own dossiers" ON public.dossiers_cee;
DROP POLICY IF EXISTS "Admins can view all dossiers" ON public.dossiers_cee;

DROP POLICY IF EXISTS "Users can view own bsd" ON public.bsd;
DROP POLICY IF EXISTS "Users can insert own bsd" ON public.bsd;
DROP POLICY IF EXISTS "Users can update own bsd" ON public.bsd;
DROP POLICY IF EXISTS "Admins can view all bsd" ON public.bsd;

DROP POLICY IF EXISTS "Users can view own traitements" ON public.traitements_phyto;
DROP POLICY IF EXISTS "Users can insert own traitements" ON public.traitements_phyto;
DROP POLICY IF EXISTS "Users can update own traitements" ON public.traitements_phyto;
DROP POLICY IF EXISTS "Admins can view all traitements" ON public.traitements_phyto;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- ============================================================================
-- DOSSIERS CEE - Politiques
-- ============================================================================

-- Les clients ne voient que leurs propres dossiers
CREATE POLICY "Users can view own dossiers" ON public.dossiers_cee
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les clients peuvent créer leurs propres dossiers
CREATE POLICY "Users can insert own dossiers" ON public.dossiers_cee
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les clients peuvent modifier leurs propres dossiers
CREATE POLICY "Users can update own dossiers" ON public.dossiers_cee
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Les admins voient tous les dossiers
CREATE POLICY "Admins can view all dossiers" ON public.dossiers_cee
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- BSD - Politiques
-- ============================================================================

CREATE POLICY "Users can view own bsd" ON public.bsd
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bsd" ON public.bsd
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bsd" ON public.bsd
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bsd" ON public.bsd
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- TRAITEMENTS PHYTO - Politiques
-- ============================================================================

CREATE POLICY "Users can view own traitements" ON public.traitements_phyto
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own traitements" ON public.traitements_phyto
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own traitements" ON public.traitements_phyto
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all traitements" ON public.traitements_phyto
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- PROFILES - Politiques
-- ============================================================================

-- Les utilisateurs ne voient que leur propre profil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Les admins voient tous les profils
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- ============================================================================
-- FONCTION: Récupérer le rôle de l'utilisateur courant
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION: Vérifier si l'utilisateur est admin
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INDEX pour optimiser les requêtes RLS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_dossiers_cee_user_id ON public.dossiers_cee(user_id);
CREATE INDEX IF NOT EXISTS idx_bsd_user_id ON public.bsd(user_id);
CREATE INDEX IF NOT EXISTS idx_traitements_phyto_user_id ON public.traitements_phyto(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
