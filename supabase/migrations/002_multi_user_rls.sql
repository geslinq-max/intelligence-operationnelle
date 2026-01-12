-- ============================================
-- Migration: Sécurisation Multi-Utilisateur
-- Ajout de user_id et politiques RLS strictes
-- ============================================

-- ============================================
-- ÉTAPE 1: Ajouter la colonne user_id à toutes les tables
-- ============================================

-- Table entreprises
ALTER TABLE entreprises 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Table rapports_scout
ALTER TABLE rapports_scout 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Table plans_optimisation
ALTER TABLE plans_optimisation 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Table verifications_conformite
ALTER TABLE verifications_conformite 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Table prospects
ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================
-- ÉTAPE 2: Créer les index pour user_id (performances)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_entreprises_user ON entreprises(user_id);
CREATE INDEX IF NOT EXISTS idx_rapports_user ON rapports_scout(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_user ON plans_optimisation(user_id);
CREATE INDEX IF NOT EXISTS idx_conformite_user ON verifications_conformite(user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_user ON prospects(user_id);

-- ============================================
-- ÉTAPE 3: Supprimer les anciennes politiques permissives
-- ============================================

DROP POLICY IF EXISTS "Accès authentifié entreprises" ON entreprises;
DROP POLICY IF EXISTS "Accès authentifié rapports" ON rapports_scout;
DROP POLICY IF EXISTS "Accès authentifié plans" ON plans_optimisation;
DROP POLICY IF EXISTS "Accès authentifié conformite" ON verifications_conformite;
DROP POLICY IF EXISTS "Accès authentifié prospects" ON prospects;

-- ============================================
-- ÉTAPE 4: Créer les nouvelles politiques RLS strictes
-- ============================================

-- === ENTREPRISES ===
-- SELECT: Un utilisateur ne voit que ses propres entreprises
CREATE POLICY "Utilisateur voit ses entreprises"
ON entreprises FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Un utilisateur ne peut créer que pour lui-même
CREATE POLICY "Utilisateur crée ses entreprises"
ON entreprises FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Un utilisateur ne peut modifier que ses propres données
CREATE POLICY "Utilisateur modifie ses entreprises"
ON entreprises FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Un utilisateur ne peut supprimer que ses propres données
CREATE POLICY "Utilisateur supprime ses entreprises"
ON entreprises FOR DELETE
USING (auth.uid() = user_id);

-- === RAPPORTS_SCOUT ===
CREATE POLICY "Utilisateur voit ses rapports"
ON rapports_scout FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Utilisateur crée ses rapports"
ON rapports_scout FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateur modifie ses rapports"
ON rapports_scout FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateur supprime ses rapports"
ON rapports_scout FOR DELETE
USING (auth.uid() = user_id);

-- === PLANS_OPTIMISATION ===
CREATE POLICY "Utilisateur voit ses plans"
ON plans_optimisation FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Utilisateur crée ses plans"
ON plans_optimisation FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateur modifie ses plans"
ON plans_optimisation FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateur supprime ses plans"
ON plans_optimisation FOR DELETE
USING (auth.uid() = user_id);

-- === VERIFICATIONS_CONFORMITE ===
CREATE POLICY "Utilisateur voit ses vérifications"
ON verifications_conformite FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Utilisateur crée ses vérifications"
ON verifications_conformite FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateur modifie ses vérifications"
ON verifications_conformite FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateur supprime ses vérifications"
ON verifications_conformite FOR DELETE
USING (auth.uid() = user_id);

-- === PROSPECTS ===
CREATE POLICY "Utilisateur voit ses prospects"
ON prospects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Utilisateur crée ses prospects"
ON prospects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateur modifie ses prospects"
ON prospects FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateur supprime ses prospects"
ON prospects FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- ÉTAPE 5: Mettre à jour les données existantes
-- Rattacher toutes les données à l'utilisateur geslinq@gmail.com
-- ============================================

-- Récupérer l'ID de l'utilisateur geslinq@gmail.com et mettre à jour les données
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Trouver l'utilisateur par email
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = 'geslinq@gmail.com'
  LIMIT 1;
  
  -- Si l'utilisateur existe, mettre à jour toutes les données orphelines
  IF target_user_id IS NOT NULL THEN
    UPDATE entreprises SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE rapports_scout SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE plans_optimisation SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE verifications_conformite SET user_id = target_user_id WHERE user_id IS NULL;
    UPDATE prospects SET user_id = target_user_id WHERE user_id IS NULL;
    
    RAISE NOTICE 'Données mises à jour pour l''utilisateur: %', target_user_id;
  ELSE
    RAISE NOTICE 'Utilisateur geslinq@gmail.com non trouvé';
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================
-- Pour vérifier que tout est en place, exécuter:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
