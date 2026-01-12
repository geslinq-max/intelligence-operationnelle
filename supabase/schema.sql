-- ============================================================================
-- CAPITAL ÉNERGIE - SCHÉMA BASE DE DONNÉES SUPABASE
-- ============================================================================
-- Script SQL complet à exécuter dans l'éditeur SQL de Supabase
-- Version: 1.1.0
-- Date: 12 janvier 2026
-- 
-- ORDRE D'EXÉCUTION STRICT:
-- 1. DROP (vues puis tables)
-- 2. EXTENSIONS
-- 3. FONCTIONS utilitaires
-- 4. TABLES (prospects → dossiers_cee → email_logs → packs_documents)
-- 5. INDEX et TRIGGERS
-- 6. POLITIQUES RLS
-- 7. VUES (en dernier)
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: NETTOYAGE COMPLET
-- ============================================================================

-- Supprimer les vues en premier (dépendent des tables)
DROP VIEW IF EXISTS v_stats_email_campaign CASCADE;
DROP VIEW IF EXISTS v_stats_prospection CASCADE;
DROP VIEW IF EXISTS v_dashboard_dossiers CASCADE;

-- Supprimer les triggers
DROP TRIGGER IF EXISTS trigger_packs_documents_updated_at ON packs_documents;
DROP TRIGGER IF EXISTS trigger_email_logs_updated_at ON email_logs;
DROP TRIGGER IF EXISTS trigger_increment_email_opens ON email_logs;
DROP TRIGGER IF EXISTS trigger_dossiers_cee_updated_at ON dossiers_cee;
DROP TRIGGER IF EXISTS trigger_calculate_cee_amounts ON dossiers_cee;
DROP TRIGGER IF EXISTS trigger_generate_dossier_reference ON dossiers_cee;
DROP TRIGGER IF EXISTS trigger_prospects_updated_at ON prospects;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS increment_email_opens() CASCADE;
DROP FUNCTION IF EXISTS calculate_cee_amounts() CASCADE;
DROP FUNCTION IF EXISTS generate_dossier_reference() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Supprimer les tables (ordre inverse des dépendances)
DROP TABLE IF EXISTS packs_documents CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS dossiers_cee CASCADE;
DROP TABLE IF EXISTS prospects CASCADE;

-- ============================================================================
-- ÉTAPE 2: EXTENSIONS REQUISES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: PROSPECTS
-- ============================================================================
-- Stocke les entreprises ciblées par l'agent de prospection

CREATE TABLE IF NOT EXISTS prospects (
  -- Identifiant unique
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Informations entreprise
  raison_sociale VARCHAR(255) NOT NULL,
  siret VARCHAR(14),
  activite TEXT,
  secteur VARCHAR(100),
  
  -- Coordonnées
  adresse TEXT,
  code_postal VARCHAR(10),
  ville VARCHAR(100),
  region VARCHAR(100),
  email VARCHAR(255),
  telephone VARCHAR(20),
  site_web VARCHAR(255),
  
  -- Contact principal
  contact_nom VARCHAR(255),
  contact_prenom VARCHAR(255),
  contact_fonction VARCHAR(100),
  
  -- Scoring IA
  score_pertinence INTEGER CHECK (score_pertinence >= 0 AND score_pertinence <= 100),
  fiche_cee_recommandee VARCHAR(20) DEFAULT 'IND-UT-102',
  potentiel_prime DECIMAL(10, 2),
  
  -- Message IA personnalisé
  message_ia_personnalise TEXT,
  message_genere_at TIMESTAMPTZ,
  
  -- Statut de prospection
  statut VARCHAR(50) DEFAULT 'nouveau' CHECK (
    statut IN ('nouveau', 'a_contacter', 'contacte', 'interesse', 'rdv_pris', 'dossier_test', 'converti', 'partenaire', 'non_interesse', 'injoignable')
  ),
  
  -- Tracking email
  email_opens_count INTEGER DEFAULT 0,
  email_clicks_count INTEGER DEFAULT 0,
  derniere_ouverture_at TIMESTAMPTZ,
  dernier_clic_at TIMESTAMPTZ,
  
  -- Source et tags
  source VARCHAR(100) DEFAULT 'prospection_ia',
  tags TEXT[],
  notes TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Index pour recherche
  CONSTRAINT prospects_siret_unique UNIQUE (siret)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_prospects_statut ON prospects(statut);
CREATE INDEX IF NOT EXISTS idx_prospects_score ON prospects(score_pertinence DESC);
CREATE INDEX IF NOT EXISTS idx_prospects_secteur ON prospects(secteur);
CREATE INDEX IF NOT EXISTS idx_prospects_region ON prospects(region);
CREATE INDEX IF NOT EXISTS idx_prospects_created_at ON prospects(created_at DESC);

-- Trigger mise à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 2: DOSSIERS_CEE
-- ============================================================================
-- Stocke les dossiers CEE avec données fiche IND-UT-102

CREATE TABLE IF NOT EXISTS dossiers_cee (
  -- Identifiant unique
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(50) UNIQUE NOT NULL, -- Ex: CE-2026-0001
  
  -- Lien prospect (optionnel)
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  
  -- Informations bénéficiaire
  beneficiaire_raison_sociale VARCHAR(255) NOT NULL,
  beneficiaire_siret VARCHAR(14),
  beneficiaire_adresse TEXT,
  beneficiaire_code_postal VARCHAR(10),
  beneficiaire_ville VARCHAR(100),
  beneficiaire_contact_nom VARCHAR(255),
  beneficiaire_email VARCHAR(255),
  beneficiaire_telephone VARCHAR(20),
  
  -- Informations artisan RGE
  artisan_raison_sociale VARCHAR(255),
  artisan_siret VARCHAR(14),
  artisan_rge_numero VARCHAR(50),
  artisan_rge_valide_jusqu TIMESTAMP,
  
  -- Données techniques IND-UT-102
  fiche_operation VARCHAR(20) DEFAULT 'IND-UT-102',
  puissance_kw DECIMAL(10, 2), -- Ex: 25.00
  type_moteur VARCHAR(100),
  presence_variateur BOOLEAN DEFAULT true,
  duree_fonctionnement VARCHAR(50), -- Ex: '4000-6000h'
  
  -- Calculs CEE
  kwh_cumac INTEGER, -- Ex: 312500
  prix_cee_mwh DECIMAL(10, 4) DEFAULT 9.50,
  prime_brute DECIMAL(10, 2), -- Ex: 2968.75
  taux_frais_gestion DECIMAL(5, 4) DEFAULT 0.10, -- 10%
  frais_gestion DECIMAL(10, 2), -- Ex: 296.87
  prime_nette_client DECIMAL(10, 2), -- Ex: 2671.88
  
  -- Statut du dossier
  statut VARCHAR(50) DEFAULT 'brouillon' CHECK (
    statut IN (
      'brouillon',
      'extraction_ok',
      'validation_ok', 
      'pack_genere',
      'en_attente_signature',
      'signe',
      'depose',
      'en_cours_validation',
      'valide',
      'paye',
      'refuse',
      'annule'
    )
  ),
  
  -- Scores de confiance IA
  confiance_extraction DECIMAL(3, 2), -- 0.00 à 1.00
  confiance_validation DECIMAL(3, 2),
  champs_a_verifier TEXT[],
  
  -- Vérification finale
  verification_finale_ok BOOLEAN DEFAULT false,
  verification_finale_at TIMESTAMPTZ,
  points_controle_passes INTEGER DEFAULT 0,
  points_controle_total INTEGER DEFAULT 7,
  
  -- Dates clés
  date_devis TIMESTAMP,
  date_signature TIMESTAMP,
  date_depot TIMESTAMP,
  date_validation TIMESTAMP,
  date_paiement TIMESTAMP,
  
  -- Fichiers source
  fichier_devis_original_url TEXT,
  fichier_devis_original_nom VARCHAR(255),
  
  -- Notes et commentaires
  notes TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_dossiers_cee_reference ON dossiers_cee(reference);
CREATE INDEX IF NOT EXISTS idx_dossiers_cee_statut ON dossiers_cee(statut);
CREATE INDEX IF NOT EXISTS idx_dossiers_cee_prospect ON dossiers_cee(prospect_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_cee_created_at ON dossiers_cee(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dossiers_cee_beneficiaire ON dossiers_cee(beneficiaire_raison_sociale);

-- Trigger mise à jour updated_at
CREATE TRIGGER trigger_dossiers_cee_updated_at
  BEFORE UPDATE ON dossiers_cee
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 3: EMAIL_LOGS
-- ============================================================================
-- Suivi des envois de la Drip Campaign (J1, J4, J7)

CREATE TABLE IF NOT EXISTS email_logs (
  -- Identifiant unique
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Liens
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  dossier_id UUID REFERENCES dossiers_cee(id) ON DELETE SET NULL,
  
  -- Étape de campagne
  campaign_step VARCHAR(20) NOT NULL CHECK (
    campaign_step IN ('initial', 'relance_j4', 'relance_j7', 'cloture', 'manuel')
  ),
  campaign_name VARCHAR(100) DEFAULT 'prospection_cee',
  
  -- Contenu email
  destinataire_email VARCHAR(255) NOT NULL,
  destinataire_nom VARCHAR(255),
  sujet VARCHAR(500) NOT NULL,
  corps_html TEXT,
  corps_text TEXT,
  
  -- Statut d'envoi
  statut VARCHAR(20) DEFAULT 'pending' CHECK (
    statut IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed')
  ),
  
  -- IDs externes
  resend_id VARCHAR(100),
  tracking_id VARCHAR(100) UNIQUE,
  
  -- Timestamps de suivi
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Compteurs
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Erreurs
  error_message TEXT,
  error_code VARCHAR(50),
  
  -- Métadonnées
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_email_logs_prospect ON email_logs(prospect_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_dossier ON email_logs(dossier_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_statut ON email_logs(statut);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_step ON email_logs(campaign_step);
CREATE INDEX IF NOT EXISTS idx_email_logs_tracking ON email_logs(tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- Trigger mise à jour updated_at
CREATE TRIGGER trigger_email_logs_updated_at
  BEFORE UPDATE ON email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 4: PACKS_DOCUMENTS
-- ============================================================================
-- Références des PDF générés (Devis CEE, AH, Mandat)

CREATE TABLE IF NOT EXISTS packs_documents (
  -- Identifiant unique
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Lien dossier
  dossier_id UUID NOT NULL REFERENCES dossiers_cee(id) ON DELETE CASCADE,
  
  -- Informations pack
  pack_reference VARCHAR(100) NOT NULL, -- Ex: Pack_CEE_CE-2026-0001
  version INTEGER DEFAULT 1,
  
  -- Document: Devis CEE
  devis_filename VARCHAR(255),
  devis_storage_path TEXT,
  devis_size_bytes INTEGER,
  devis_generated_at TIMESTAMPTZ,
  
  -- Document: Attestation sur l'Honneur
  ah_filename VARCHAR(255),
  ah_storage_path TEXT,
  ah_size_bytes INTEGER,
  ah_generated_at TIMESTAMPTZ,
  
  -- Document: Mandat de Délégation
  mandat_filename VARCHAR(255),
  mandat_storage_path TEXT,
  mandat_size_bytes INTEGER,
  mandat_generated_at TIMESTAMPTZ,
  
  -- Archive ZIP
  zip_filename VARCHAR(255),
  zip_storage_path TEXT,
  zip_size_bytes INTEGER,
  zip_generated_at TIMESTAMPTZ,
  
  -- Statut des signatures
  devis_signe BOOLEAN DEFAULT false,
  devis_signe_at TIMESTAMPTZ,
  ah_signe BOOLEAN DEFAULT false,
  ah_signe_at TIMESTAMPTZ,
  mandat_signe BOOLEAN DEFAULT false,
  mandat_signe_at TIMESTAMPTZ,
  
  -- Vérification finale
  verification_finale_passee BOOLEAN DEFAULT false,
  verification_checkpoints JSONB, -- Stocke le résultat des 7 points de contrôle
  revenu_genere DECIMAL(10, 2),
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_packs_documents_dossier ON packs_documents(dossier_id);
CREATE INDEX IF NOT EXISTS idx_packs_documents_reference ON packs_documents(pack_reference);
CREATE INDEX IF NOT EXISTS idx_packs_documents_created_at ON packs_documents(created_at DESC);

-- Trigger mise à jour updated_at
CREATE TRIGGER trigger_packs_documents_updated_at
  BEFORE UPDATE ON packs_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- POLITIQUES DE SÉCURITÉ RLS (Row Level Security)
-- ============================================================================
-- Accès restreint à l'administrateur uniquement

-- Activer RLS sur toutes les tables
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossiers_cee ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE packs_documents ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Admin full access prospects" ON prospects;
DROP POLICY IF EXISTS "Admin full access dossiers_cee" ON dossiers_cee;
DROP POLICY IF EXISTS "Admin full access email_logs" ON email_logs;
DROP POLICY IF EXISTS "Admin full access packs_documents" ON packs_documents;

-- ============================================================================
-- OPTION A: Accès par rôle service (pour l'application)
-- ============================================================================
-- Ces politiques permettent l'accès via la clé service_role de Supabase
-- Utilisez SUPABASE_SERVICE_ROLE_KEY côté serveur

CREATE POLICY "Service role full access prospects"
  ON prospects FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access dossiers_cee"
  ON dossiers_cee FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access email_logs"
  ON email_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access packs_documents"
  ON packs_documents FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- OPTION B: Accès par utilisateur authentifié spécifique (Admin)
-- ============================================================================
-- Remplacez 'VOTRE_USER_ID_ADMIN' par votre UUID d'utilisateur Supabase
-- Pour trouver votre UUID: SELECT id FROM auth.users WHERE email = 'votre@email.com';

-- CREATE POLICY "Admin user full access prospects"
--   ON prospects FOR ALL
--   USING (auth.uid() = 'VOTRE_USER_ID_ADMIN'::uuid)
--   WITH CHECK (auth.uid() = 'VOTRE_USER_ID_ADMIN'::uuid);

-- CREATE POLICY "Admin user full access dossiers_cee"
--   ON dossiers_cee FOR ALL
--   USING (auth.uid() = 'VOTRE_USER_ID_ADMIN'::uuid)
--   WITH CHECK (auth.uid() = 'VOTRE_USER_ID_ADMIN'::uuid);

-- CREATE POLICY "Admin user full access email_logs"
--   ON email_logs FOR ALL
--   USING (auth.uid() = 'VOTRE_USER_ID_ADMIN'::uuid)
--   WITH CHECK (auth.uid() = 'VOTRE_USER_ID_ADMIN'::uuid);

-- CREATE POLICY "Admin user full access packs_documents"
--   ON packs_documents FOR ALL
--   USING (auth.uid() = 'VOTRE_USER_ID_ADMIN'::uuid)
--   WITH CHECK (auth.uid() = 'VOTRE_USER_ID_ADMIN'::uuid);

-- ============================================================================
-- FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour générer une référence de dossier unique
CREATE OR REPLACE FUNCTION generate_dossier_reference()
RETURNS TRIGGER AS $$
DECLARE
  year_part VARCHAR(4);
  sequence_num INTEGER;
  new_reference VARCHAR(50);
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(reference FROM 'CE-' || year_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM dossiers_cee
  WHERE reference LIKE 'CE-' || year_part || '-%';
  
  new_reference := 'CE-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  NEW.reference := new_reference;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-générer la référence
CREATE TRIGGER trigger_generate_dossier_reference
  BEFORE INSERT ON dossiers_cee
  FOR EACH ROW
  WHEN (NEW.reference IS NULL OR NEW.reference = '')
  EXECUTE FUNCTION generate_dossier_reference();

-- Fonction pour calculer automatiquement les montants CEE
CREATE OR REPLACE FUNCTION calculate_cee_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer kWh cumac si puissance définie
  IF NEW.puissance_kw IS NOT NULL AND NEW.kwh_cumac IS NULL THEN
    NEW.kwh_cumac := ROUND(NEW.puissance_kw * 12500);
  END IF;
  
  -- Calculer prime brute si kWh cumac défini
  IF NEW.kwh_cumac IS NOT NULL AND NEW.prime_brute IS NULL THEN
    NEW.prime_brute := ROUND((NEW.kwh_cumac / 1000.0) * COALESCE(NEW.prix_cee_mwh, 9.50) * 100) / 100;
  END IF;
  
  -- Calculer frais de gestion
  IF NEW.prime_brute IS NOT NULL THEN
    NEW.frais_gestion := ROUND(NEW.prime_brute * COALESCE(NEW.taux_frais_gestion, 0.10) * 100) / 100;
    NEW.prime_nette_client := NEW.prime_brute - NEW.frais_gestion;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculs automatiques
CREATE TRIGGER trigger_calculate_cee_amounts
  BEFORE INSERT OR UPDATE ON dossiers_cee
  FOR EACH ROW
  EXECUTE FUNCTION calculate_cee_amounts();

-- Fonction pour mettre à jour le compteur d'ouvertures email
CREATE OR REPLACE FUNCTION increment_email_opens()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut = 'opened' AND OLD.statut != 'opened' THEN
    NEW.open_count := COALESCE(OLD.open_count, 0) + 1;
    NEW.opened_at := COALESCE(NEW.opened_at, NOW());
    
    -- Mettre à jour le prospect associé
    IF NEW.prospect_id IS NOT NULL THEN
      UPDATE prospects
      SET 
        email_opens_count = email_opens_count + 1,
        derniere_ouverture_at = NOW()
      WHERE id = NEW.prospect_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_email_opens
  BEFORE UPDATE ON email_logs
  FOR EACH ROW
  EXECUTE FUNCTION increment_email_opens();

-- ============================================================================
-- VUES UTILITAIRES
-- ============================================================================

-- Vue: Tableau de bord des dossiers
CREATE OR REPLACE VIEW v_dashboard_dossiers AS
SELECT 
  d.id,
  d.reference,
  d.beneficiaire_raison_sociale,
  d.statut,
  d.puissance_kw,
  d.kwh_cumac,
  d.prime_brute,
  d.frais_gestion AS revenu_genere,
  d.prime_nette_client,
  d.verification_finale_ok,
  d.created_at,
  p.pack_reference,
  p.devis_signe,
  p.ah_signe,
  p.mandat_signe
FROM dossiers_cee d
LEFT JOIN packs_documents p ON p.dossier_id = d.id
ORDER BY d.created_at DESC;

-- Vue: Statistiques de prospection
CREATE OR REPLACE VIEW v_stats_prospection AS
SELECT 
  statut,
  COUNT(*) as nombre,
  AVG(score_pertinence) as score_moyen,
  SUM(potentiel_prime) as potentiel_total
FROM prospects
GROUP BY statut
ORDER BY nombre DESC;

-- Vue: Performance des campagnes email
CREATE OR REPLACE VIEW v_stats_email_campaign AS
SELECT 
  campaign_step,
  COUNT(*) as total_envoyes,
  COUNT(*) FILTER (WHERE statut = 'delivered') as livres,
  COUNT(*) FILTER (WHERE statut IN ('opened', 'clicked')) as ouverts,
  COUNT(*) FILTER (WHERE statut = 'clicked') as cliques,
  COUNT(*) FILTER (WHERE statut = 'bounced') as bounces,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE statut IN ('opened', 'clicked')) / NULLIF(COUNT(*), 0),
    2
  ) as taux_ouverture
FROM email_logs
WHERE statut != 'pending'
GROUP BY campaign_step
ORDER BY campaign_step;

-- ============================================================================
-- DONNÉES DE DÉMONSTRATION (Optionnel)
-- ============================================================================
-- Décommentez pour insérer des données de test

/*
-- Prospect de démonstration
INSERT INTO prospects (
  raison_sociale,
  siret,
  activite,
  secteur,
  ville,
  region,
  email,
  score_pertinence,
  message_ia_personnalise,
  statut
) VALUES (
  'Fonderie Martin SAS',
  '12345678901234',
  'Installation et maintenance de systèmes de pompage industriel',
  'Maintenance Industrielle',
  'Lyon',
  'Auvergne-Rhône-Alpes',
  'contact@fonderie-martin.fr',
  95,
  'Jean, j''ai vu que vous travaillez sur les systèmes de pompage à Lyon. Saviez-vous que je peux diviser vos devis par 3 grâce à la prime CEE de 2 969 € ?',
  'nouveau'
);

-- Dossier CEE de démonstration
INSERT INTO dossiers_cee (
  beneficiaire_raison_sociale,
  beneficiaire_siret,
  beneficiaire_adresse,
  beneficiaire_code_postal,
  beneficiaire_ville,
  puissance_kw,
  type_moteur,
  presence_variateur,
  statut
) VALUES (
  'Fonderie Martin SAS',
  '12345678901234',
  '15 rue de l''Industrie',
  '69003',
  'Lyon',
  25.00,
  'Moteur asynchrone IE3',
  true,
  'pack_genere'
);
*/

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
-- Ce script a créé :
-- ✅ Table prospects (prospection CEE)
-- ✅ Table dossiers_cee (données IND-UT-102)
-- ✅ Table email_logs (Drip Campaign J1/J4/J7)
-- ✅ Table packs_documents (Devis, AH, Mandat)
-- ✅ Politiques RLS (accès admin uniquement)
-- ✅ Fonctions utilitaires (génération référence, calculs auto)
-- ✅ Vues pour tableau de bord
-- ============================================================================

SELECT 'Script exécuté avec succès ! 🚀' AS message;
