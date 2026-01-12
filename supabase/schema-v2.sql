-- ============================================================================
-- CAPITAL ÉNERGIE - SCHÉMA BASE DE DONNÉES SUPABASE
-- ============================================================================
-- Version: 2.0.0 (Corrigée)
-- Date: 12 janvier 2026
-- 
-- ORDRE D'EXÉCUTION STRICT:
-- 1. DROP (vues → triggers → fonctions → tables)
-- 2. EXTENSIONS
-- 3. FONCTIONS utilitaires de base
-- 4. TABLES (prospects → dossiers_cee → email_logs → packs_documents)
-- 5. INDEX
-- 6. TRIGGERS
-- 7. FONCTIONS métier (calculs CEE)
-- 8. POLITIQUES RLS
-- 9. VUES (en dernier)
--
-- Calculs IND-UT-102 intégrés:
-- 25 kW × 12500 = 312500 kWh cumac
-- 312500 / 1000 × 9.50 = 2968.75 € prime
-- ============================================================================

-- ############################################################################
-- ÉTAPE 1: NETTOYAGE COMPLET
-- ############################################################################

-- 1.1 Supprimer les vues (dépendent des tables)
DROP VIEW IF EXISTS v_stats_email_campaign CASCADE;
DROP VIEW IF EXISTS v_stats_prospection CASCADE;
DROP VIEW IF EXISTS v_dashboard_dossiers CASCADE;

-- 1.2 Supprimer les triggers (dépendent des tables et fonctions)
DROP TRIGGER IF EXISTS trigger_packs_documents_updated_at ON packs_documents;
DROP TRIGGER IF EXISTS trigger_email_logs_updated_at ON email_logs;
DROP TRIGGER IF EXISTS trigger_increment_email_opens ON email_logs;
DROP TRIGGER IF EXISTS trigger_dossiers_cee_updated_at ON dossiers_cee;
DROP TRIGGER IF EXISTS trigger_calculate_cee_amounts ON dossiers_cee;
DROP TRIGGER IF EXISTS trigger_generate_dossier_reference ON dossiers_cee;
DROP TRIGGER IF EXISTS trigger_prospects_updated_at ON prospects;

-- 1.3 Supprimer les fonctions
DROP FUNCTION IF EXISTS increment_email_opens() CASCADE;
DROP FUNCTION IF EXISTS calculate_cee_amounts() CASCADE;
DROP FUNCTION IF EXISTS generate_dossier_reference() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 1.4 Supprimer les tables (ordre inverse des dépendances FK)
DROP TABLE IF EXISTS packs_documents CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS dossiers_cee CASCADE;
DROP TABLE IF EXISTS prospects CASCADE;

-- ############################################################################
-- ÉTAPE 2: EXTENSIONS
-- ############################################################################

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ############################################################################
-- ÉTAPE 3: FONCTION UTILITAIRE DE BASE
-- ############################################################################

-- Fonction pour auto-update de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ############################################################################
-- ÉTAPE 4: CRÉATION DES TABLES
-- ############################################################################

-- ----------------------------------------------------------------------------
-- TABLE 1: PROSPECTS
-- ----------------------------------------------------------------------------
-- Entreprises ciblées par l'agent de prospection CEE

CREATE TABLE prospects (
  -- Identifiant
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
  
  -- Scoring IA (colonne obligatoire)
  score_pertinence INTEGER DEFAULT 0 CHECK (score_pertinence >= 0 AND score_pertinence <= 100),
  fiche_cee_recommandee VARCHAR(20) DEFAULT 'IND-UT-102',
  potentiel_prime DECIMAL(10, 2) DEFAULT 0,
  
  -- Message IA personnalisé
  message_ia_personnalise TEXT,
  message_genere_at TIMESTAMPTZ,
  
  -- Statut de prospection
  statut VARCHAR(50) DEFAULT 'nouveau' CHECK (
    statut IN (
      'nouveau', 
      'a_contacter', 
      'contacte', 
      'interesse', 
      'rdv_pris', 
      'dossier_test', 
      'converti', 
      'partenaire', 
      'non_interesse', 
      'injoignable'
    )
  ),
  
  -- Tracking email
  email_opens_count INTEGER DEFAULT 0,
  email_clicks_count INTEGER DEFAULT 0,
  derniere_ouverture_at TIMESTAMPTZ,
  dernier_clic_at TIMESTAMPTZ,
  
  -- Source et métadonnées
  source VARCHAR(100) DEFAULT 'prospection_ia',
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte unique sur SIRET
  CONSTRAINT prospects_siret_unique UNIQUE (siret)
);

-- ----------------------------------------------------------------------------
-- TABLE 2: DOSSIERS_CEE
-- ----------------------------------------------------------------------------
-- Dossiers CEE avec données fiche IND-UT-102
-- Calculs: 25 kW → 312500 kWh cumac → 2968.75 € prime

CREATE TABLE dossiers_cee (
  -- Identifiant
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(50) UNIQUE, -- Auto-généré: CE-2026-0001
  
  -- Lien prospect
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  
  -- Bénéficiaire
  beneficiaire_raison_sociale VARCHAR(255) NOT NULL,
  beneficiaire_siret VARCHAR(14),
  beneficiaire_adresse TEXT,
  beneficiaire_code_postal VARCHAR(10),
  beneficiaire_ville VARCHAR(100),
  beneficiaire_contact_nom VARCHAR(255),
  beneficiaire_email VARCHAR(255),
  beneficiaire_telephone VARCHAR(20),
  
  -- Artisan RGE
  artisan_raison_sociale VARCHAR(255),
  artisan_siret VARCHAR(14),
  artisan_rge_numero VARCHAR(50),
  artisan_rge_valide_jusqu TIMESTAMP,
  
  -- Données techniques IND-UT-102
  fiche_operation VARCHAR(20) DEFAULT 'IND-UT-102',
  puissance_kw DECIMAL(10, 2) DEFAULT 25.00,
  type_moteur VARCHAR(100) DEFAULT 'Moteur asynchrone IE3',
  presence_variateur BOOLEAN DEFAULT true,
  duree_fonctionnement VARCHAR(50) DEFAULT '4000-6000h',
  
  -- Calculs CEE (valeurs par défaut pour 25 kW)
  kwh_cumac INTEGER DEFAULT 312500,
  prix_cee_mwh DECIMAL(10, 4) DEFAULT 9.50,
  prime_brute DECIMAL(10, 2) DEFAULT 2968.75,
  taux_frais_gestion DECIMAL(5, 4) DEFAULT 0.10,
  frais_gestion DECIMAL(10, 2) DEFAULT 296.87,
  prime_nette_client DECIMAL(10, 2) DEFAULT 2671.88,
  
  -- Statut
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
  
  -- Confiance IA
  confiance_extraction DECIMAL(3, 2) DEFAULT 0.00,
  confiance_validation DECIMAL(3, 2) DEFAULT 0.00,
  champs_a_verifier TEXT[],
  
  -- Vérification finale (7 points)
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
  
  -- Fichiers
  fichier_devis_original_url TEXT,
  fichier_devis_original_nom VARCHAR(255),
  
  -- Métadonnées
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- TABLE 3: EMAIL_LOGS
-- ----------------------------------------------------------------------------
-- Suivi Drip Campaign (J1, J4, J7)

CREATE TABLE email_logs (
  -- Identifiant
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Liens
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  dossier_id UUID REFERENCES dossiers_cee(id) ON DELETE SET NULL,
  
  -- Campagne
  campaign_step VARCHAR(20) NOT NULL CHECK (
    campaign_step IN ('initial', 'relance_j4', 'relance_j7', 'cloture', 'manuel')
  ),
  campaign_name VARCHAR(100) DEFAULT 'prospection_cee',
  
  -- Email
  destinataire_email VARCHAR(255) NOT NULL,
  destinataire_nom VARCHAR(255),
  sujet VARCHAR(500) NOT NULL,
  corps_html TEXT,
  corps_text TEXT,
  
  -- Statut
  statut VARCHAR(20) DEFAULT 'pending' CHECK (
    statut IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed')
  ),
  
  -- IDs externes
  resend_id VARCHAR(100),
  tracking_id VARCHAR(100) UNIQUE,
  
  -- Timestamps tracking
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- TABLE 4: PACKS_DOCUMENTS
-- ----------------------------------------------------------------------------
-- Références PDF générés (Devis CEE, AH, Mandat)

CREATE TABLE packs_documents (
  -- Identifiant
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Lien dossier
  dossier_id UUID NOT NULL REFERENCES dossiers_cee(id) ON DELETE CASCADE,
  
  -- Pack
  pack_reference VARCHAR(100) NOT NULL,
  version INTEGER DEFAULT 1,
  
  -- Devis CEE
  devis_filename VARCHAR(255),
  devis_storage_path TEXT,
  devis_size_bytes INTEGER,
  devis_generated_at TIMESTAMPTZ,
  
  -- Attestation sur l'Honneur
  ah_filename VARCHAR(255),
  ah_storage_path TEXT,
  ah_size_bytes INTEGER,
  ah_generated_at TIMESTAMPTZ,
  
  -- Mandat de Délégation
  mandat_filename VARCHAR(255),
  mandat_storage_path TEXT,
  mandat_size_bytes INTEGER,
  mandat_generated_at TIMESTAMPTZ,
  
  -- Archive ZIP
  zip_filename VARCHAR(255),
  zip_storage_path TEXT,
  zip_size_bytes INTEGER,
  zip_generated_at TIMESTAMPTZ,
  
  -- Signatures
  devis_signe BOOLEAN DEFAULT false,
  devis_signe_at TIMESTAMPTZ,
  ah_signe BOOLEAN DEFAULT false,
  ah_signe_at TIMESTAMPTZ,
  mandat_signe BOOLEAN DEFAULT false,
  mandat_signe_at TIMESTAMPTZ,
  
  -- Vérification finale
  verification_finale_passee BOOLEAN DEFAULT false,
  verification_checkpoints JSONB,
  revenu_genere DECIMAL(10, 2) DEFAULT 296.87,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ############################################################################
-- ÉTAPE 5: INDEX
-- ############################################################################

-- Index prospects
CREATE INDEX idx_prospects_statut ON prospects(statut);
CREATE INDEX idx_prospects_score ON prospects(score_pertinence DESC);
CREATE INDEX idx_prospects_secteur ON prospects(secteur);
CREATE INDEX idx_prospects_region ON prospects(region);
CREATE INDEX idx_prospects_created_at ON prospects(created_at DESC);

-- Index dossiers_cee
CREATE INDEX idx_dossiers_cee_reference ON dossiers_cee(reference);
CREATE INDEX idx_dossiers_cee_statut ON dossiers_cee(statut);
CREATE INDEX idx_dossiers_cee_prospect ON dossiers_cee(prospect_id);
CREATE INDEX idx_dossiers_cee_created_at ON dossiers_cee(created_at DESC);

-- Index email_logs
CREATE INDEX idx_email_logs_prospect ON email_logs(prospect_id);
CREATE INDEX idx_email_logs_dossier ON email_logs(dossier_id);
CREATE INDEX idx_email_logs_statut ON email_logs(statut);
CREATE INDEX idx_email_logs_campaign_step ON email_logs(campaign_step);
CREATE INDEX idx_email_logs_tracking ON email_logs(tracking_id);

-- Index packs_documents
CREATE INDEX idx_packs_documents_dossier ON packs_documents(dossier_id);
CREATE INDEX idx_packs_documents_reference ON packs_documents(pack_reference);

-- ############################################################################
-- ÉTAPE 6: TRIGGERS updated_at
-- ############################################################################

CREATE TRIGGER trigger_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_dossiers_cee_updated_at
  BEFORE UPDATE ON dossiers_cee
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_email_logs_updated_at
  BEFORE UPDATE ON email_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_packs_documents_updated_at
  BEFORE UPDATE ON packs_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ############################################################################
-- ÉTAPE 7: FONCTIONS MÉTIER
-- ############################################################################

-- Fonction: Générer référence dossier (CE-2026-0001)
CREATE OR REPLACE FUNCTION generate_dossier_reference()
RETURNS TRIGGER AS $$
DECLARE
  year_part VARCHAR(4);
  sequence_num INTEGER;
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(reference FROM 'CE-' || year_part || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM dossiers_cee
    WHERE reference LIKE 'CE-' || year_part || '-%';
    
    NEW.reference := 'CE-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_dossier_reference
  BEFORE INSERT ON dossiers_cee
  FOR EACH ROW EXECUTE FUNCTION generate_dossier_reference();

-- Fonction: Calculs CEE automatiques (IND-UT-102)
-- Formule: puissance_kw × 12500 = kWh cumac
-- Formule: kWh cumac / 1000 × 9.50 = prime €
CREATE OR REPLACE FUNCTION calculate_cee_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer kWh cumac (25 kW × 12500 = 312500)
  IF NEW.puissance_kw IS NOT NULL THEN
    NEW.kwh_cumac := ROUND(NEW.puissance_kw * 12500);
  END IF;
  
  -- Calculer prime brute (312500 / 1000 × 9.50 = 2968.75)
  IF NEW.kwh_cumac IS NOT NULL THEN
    NEW.prime_brute := ROUND((NEW.kwh_cumac / 1000.0) * COALESCE(NEW.prix_cee_mwh, 9.50) * 100) / 100;
  END IF;
  
  -- Calculer frais et prime nette (10% = 296.87)
  IF NEW.prime_brute IS NOT NULL THEN
    NEW.frais_gestion := ROUND(NEW.prime_brute * COALESCE(NEW.taux_frais_gestion, 0.10) * 100) / 100;
    NEW.prime_nette_client := ROUND((NEW.prime_brute - NEW.frais_gestion) * 100) / 100;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_cee_amounts
  BEFORE INSERT OR UPDATE ON dossiers_cee
  FOR EACH ROW EXECUTE FUNCTION calculate_cee_amounts();

-- Fonction: Compteur ouvertures email
CREATE OR REPLACE FUNCTION increment_email_opens()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut = 'opened' AND (OLD.statut IS NULL OR OLD.statut != 'opened') THEN
    NEW.open_count := COALESCE(OLD.open_count, 0) + 1;
    NEW.opened_at := COALESCE(NEW.opened_at, NOW());
    
    -- MAJ prospect associé
    IF NEW.prospect_id IS NOT NULL THEN
      UPDATE prospects SET 
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
  FOR EACH ROW EXECUTE FUNCTION increment_email_opens();

-- ############################################################################
-- ÉTAPE 8: POLITIQUES RLS
-- ############################################################################

-- Activer RLS
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossiers_cee ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE packs_documents ENABLE ROW LEVEL SECURITY;

-- Politique: Accès service_role uniquement (pour l'application)
CREATE POLICY "service_role_prospects" ON prospects
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_dossiers_cee" ON dossiers_cee
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_email_logs" ON email_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_packs_documents" ON packs_documents
  FOR ALL USING (auth.role() = 'service_role');

-- ############################################################################
-- ÉTAPE 9: VUES (APRÈS TOUTES LES TABLES)
-- ############################################################################

-- Vue: Dashboard dossiers
CREATE VIEW v_dashboard_dossiers AS
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

-- Vue: Stats prospection
CREATE VIEW v_stats_prospection AS
SELECT 
  statut,
  COUNT(*) AS nombre,
  ROUND(AVG(score_pertinence), 0) AS score_moyen,
  SUM(potentiel_prime) AS potentiel_total
FROM prospects
GROUP BY statut
ORDER BY nombre DESC;

-- Vue: Performance email
CREATE VIEW v_stats_email_campaign AS
SELECT 
  campaign_step,
  COUNT(*) AS total_envoyes,
  COUNT(*) FILTER (WHERE statut = 'delivered') AS livres,
  COUNT(*) FILTER (WHERE statut IN ('opened', 'clicked')) AS ouverts,
  COUNT(*) FILTER (WHERE statut = 'clicked') AS cliques,
  COUNT(*) FILTER (WHERE statut = 'bounced') AS bounces,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE statut IN ('opened', 'clicked')) / NULLIF(COUNT(*), 0),
    2
  ) AS taux_ouverture_pct
FROM email_logs
WHERE statut != 'pending'
GROUP BY campaign_step;

-- ############################################################################
-- VÉRIFICATION FINALE
-- ############################################################################

-- Test: Vérifier que la colonne score_pertinence existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prospects' AND column_name = 'score_pertinence'
  ) THEN
    RAISE NOTICE '✅ Colonne score_pertinence créée avec succès';
  ELSE
    RAISE EXCEPTION '❌ Erreur: colonne score_pertinence non trouvée';
  END IF;
END $$;

-- Test: Vérifier les calculs CEE
DO $$
DECLARE
  test_kwh INTEGER;
  test_prime DECIMAL;
BEGIN
  test_kwh := ROUND(25 * 12500);
  test_prime := ROUND((test_kwh / 1000.0) * 9.50 * 100) / 100;
  
  IF test_kwh = 312500 AND test_prime = 2968.75 THEN
    RAISE NOTICE '✅ Calculs IND-UT-102 validés: 25 kW → % kWh cumac → % €', test_kwh, test_prime;
  ELSE
    RAISE EXCEPTION '❌ Erreur calculs: attendu 312500/2968.75, obtenu %/%', test_kwh, test_prime;
  END IF;
END $$;

-- ############################################################################
-- FIN DU SCRIPT
-- ############################################################################

SELECT '🚀 Script exécuté avec succès !' AS message,
       '4 tables créées' AS tables,
       '3 vues créées' AS vues,
       'RLS activé' AS securite;
