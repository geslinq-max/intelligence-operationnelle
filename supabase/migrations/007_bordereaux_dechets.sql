-- ============================================================================
-- Migration: Bordereaux de Suivi des Déchets (BSD)
-- Table pour stocker les BSD créés via Trackdéchets ou en mode local
-- ============================================================================

-- Table principale des bordereaux
CREATE TABLE IF NOT EXISTS bordereaux_dechets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifiants Trackdéchets
  trackdechets_id TEXT UNIQUE,
  readable_id TEXT NOT NULL UNIQUE,
  
  -- Statut et mode
  status TEXT NOT NULL DEFAULT 'DRAFT',
  mode TEXT NOT NULL DEFAULT 'LOCAL' CHECK (mode IN ('PRODUCTION', 'LOCAL')),
  
  -- Informations chantier
  chantier_nom TEXT NOT NULL,
  chantier_adresse TEXT NOT NULL,
  date_enlevement DATE NOT NULL,
  
  -- Producteur
  producteur_nom TEXT NOT NULL,
  producteur_siret TEXT,
  producteur_tel TEXT,
  
  -- Déchet
  type_dechet TEXT NOT NULL,
  code_dechet TEXT NOT NULL,
  tonnage_estime DECIMAL(10,2) NOT NULL,
  volume_estime DECIMAL(10,2),
  conditionnement TEXT NOT NULL,
  
  -- Destination
  destination_nom TEXT NOT NULL,
  destination_adresse TEXT,
  destination_type TEXT NOT NULL,
  
  -- Transporteur
  transporteur_nom TEXT NOT NULL,
  transporteur_siret TEXT,
  immatriculation TEXT,
  
  -- Signatures (base64)
  signature_producteur TEXT,
  signature_transporteur TEXT,
  
  -- Traitement
  processing_date TIMESTAMPTZ,
  reception_weight DECIMAL(10,2),
  operation_code TEXT,
  
  -- Métadonnées
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_bordereaux_readable_id ON bordereaux_dechets(readable_id);
CREATE INDEX IF NOT EXISTS idx_bordereaux_trackdechets_id ON bordereaux_dechets(trackdechets_id);
CREATE INDEX IF NOT EXISTS idx_bordereaux_status ON bordereaux_dechets(status);
CREATE INDEX IF NOT EXISTS idx_bordereaux_user_id ON bordereaux_dechets(user_id);
CREATE INDEX IF NOT EXISTS idx_bordereaux_date ON bordereaux_dechets(date_enlevement);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_bordereaux_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bordereaux_updated_at ON bordereaux_dechets;
CREATE TRIGGER trigger_bordereaux_updated_at
  BEFORE UPDATE ON bordereaux_dechets
  FOR EACH ROW
  EXECUTE FUNCTION update_bordereaux_updated_at();

-- RLS Policies
ALTER TABLE bordereaux_dechets ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres bordereaux
CREATE POLICY "Users can view own bordereaux"
  ON bordereaux_dechets
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Politique: Les utilisateurs peuvent créer des bordereaux
CREATE POLICY "Users can create bordereaux"
  ON bordereaux_dechets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Politique: Les utilisateurs peuvent mettre à jour leurs bordereaux
CREATE POLICY "Users can update own bordereaux"
  ON bordereaux_dechets
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Table de suivi des notifications BSD
CREATE TABLE IF NOT EXISTS bsd_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bordereau_id UUID REFERENCES bordereaux_dechets(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('CREATED', 'SIGNED', 'SENT', 'RECEIVED', 'PROCESSED', 'REFUSED')),
  recipient_phone TEXT,
  recipient_email TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_bsd_notifications_bordereau ON bsd_notifications(bordereau_id);

-- Commentaires
COMMENT ON TABLE bordereaux_dechets IS 'Bordereaux de Suivi des Déchets - Intégration Trackdéchets';
COMMENT ON COLUMN bordereaux_dechets.trackdechets_id IS 'ID interne Trackdéchets (format UUID)';
COMMENT ON COLUMN bordereaux_dechets.readable_id IS 'Numéro officiel du bordereau (ex: BSDA-20260131-XXXXXX)';
COMMENT ON COLUMN bordereaux_dechets.mode IS 'PRODUCTION = transmis à Trackdéchets, LOCAL = enregistré localement';
