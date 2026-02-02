-- ============================================================================
-- Migration: Correction Sécurité RLS - Issues SEC-003 & SEC-004
-- Interdire tout accès si user_id est NULL
-- ============================================================================

-- ============================================================================
-- SEC-003 : Corriger RLS bordereaux_dechets
-- PROBLÈME: Les politiques actuelles autorisent l'accès si user_id IS NULL
-- ============================================================================

-- Supprimer les anciennes politiques permissives
DROP POLICY IF EXISTS "Users can view own bordereaux" ON bordereaux_dechets;
DROP POLICY IF EXISTS "Users can create bordereaux" ON bordereaux_dechets;
DROP POLICY IF EXISTS "Users can update own bordereaux" ON bordereaux_dechets;

-- Recréer avec restriction STRICTE (user_id obligatoire)
CREATE POLICY "Users can view own bordereaux"
  ON bordereaux_dechets
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can create bordereaux"
  ON bordereaux_dechets
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own bordereaux"
  ON bordereaux_dechets
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete own bordereaux"
  ON bordereaux_dechets
  FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ============================================================================
-- SEC-004 : Ajouter RLS sur bsd_notifications
-- PROBLÈME: Table non protégée par RLS
-- ============================================================================

-- Activer RLS sur la table
ALTER TABLE bsd_notifications ENABLE ROW LEVEL SECURITY;

-- Politique SELECT: Un utilisateur ne peut voir que les notifications de SES bordereaux
CREATE POLICY "Users can view own bsd notifications"
  ON bsd_notifications
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    bordereau_id IN (
      SELECT id FROM bordereaux_dechets WHERE user_id = auth.uid()
    )
  );

-- Politique INSERT: Un utilisateur ne peut créer des notifications que pour SES bordereaux
CREATE POLICY "Users can create own bsd notifications"
  ON bsd_notifications
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    bordereau_id IN (
      SELECT id FROM bordereaux_dechets WHERE user_id = auth.uid()
    )
  );

-- Politique UPDATE: Un utilisateur ne peut modifier que les notifications de SES bordereaux
CREATE POLICY "Users can update own bsd notifications"
  ON bsd_notifications
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    bordereau_id IN (
      SELECT id FROM bordereaux_dechets WHERE user_id = auth.uid()
    )
  );

-- Politique DELETE: Un utilisateur ne peut supprimer que les notifications de SES bordereaux
CREATE POLICY "Users can delete own bsd notifications"
  ON bsd_notifications
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    bordereau_id IN (
      SELECT id FROM bordereaux_dechets WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- Index pour optimiser les requêtes RLS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bordereaux_user_id_status ON bordereaux_dechets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bsd_notifications_bordereau_id ON bsd_notifications(bordereau_id);

-- ============================================================================
-- Commentaires
-- ============================================================================

COMMENT ON POLICY "Users can view own bordereaux" ON bordereaux_dechets IS 
  'SEC-003 FIX: Accès SELECT strictement limité au propriétaire (user_id obligatoire)';

COMMENT ON POLICY "Users can view own bsd notifications" ON bsd_notifications IS 
  'SEC-004 FIX: Accès SELECT via jointure sur bordereaux_dechets.user_id';
