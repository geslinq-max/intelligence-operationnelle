-- ============================================================================
-- CAPITAL ÉNERGIE - SCRIPT DE RÉPARATION SUPABASE
-- ============================================================================
-- Version: 3.0.0 (Réparation complète)
-- Date: 12 janvier 2026
-- 
-- Ce script utilise des blocs DO $$ pour vérifier l'existence de chaque
-- élément avant suppression, évitant les erreurs "does not exist".
--
-- ORDRE STRICT:
-- 1. Suppression sécurisée: VUES → FONCTIONS → TABLES
-- 2. Extension uuid-ossp
-- 3. Création tables: IF NOT EXISTS
-- 4. Index
-- 5. Fonction calculs CEE (séparée)
-- 6. Triggers (après tables ET fonctions)
-- 7. RLS
-- 8. Vues
-- 9. Test d'insertion
-- ============================================================================

-- ############################################################################
-- ÉTAPE 1: SUPPRESSION SÉCURISÉE DES VUES
-- ############################################################################

DO $$
BEGIN
  -- Supprimer les vues si elles existent
  DROP VIEW IF EXISTS v_stats_email_campaign;
  DROP VIEW IF EXISTS v_stats_prospection;
  DROP VIEW IF EXISTS v_dashboard_dossiers;
  RAISE NOTICE '✓ Vues supprimées (si existaient)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Note: Erreur suppression vues ignorée: %', SQLERRM;
END $$;

-- ############################################################################
-- ÉTAPE 2: SUPPRESSION SÉCURISÉE DES TRIGGERS ET FONCTIONS
-- ############################################################################

DO $$
BEGIN
  -- Supprimer triggers sur packs_documents (si table existe)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packs_documents') THEN
    DROP TRIGGER IF EXISTS trigger_packs_documents_updated_at ON packs_documents;
  END IF;
  
  -- Supprimer triggers sur email_logs (si table existe)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs') THEN
    DROP TRIGGER IF EXISTS trigger_email_logs_updated_at ON email_logs;
    DROP TRIGGER IF EXISTS trigger_increment_email_opens ON email_logs;
  END IF;
  
  -- Supprimer triggers sur dossiers_cee (si table existe)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dossiers_cee') THEN
    DROP TRIGGER IF EXISTS trigger_dossiers_cee_updated_at ON dossiers_cee;
    DROP TRIGGER IF EXISTS trigger_calculate_cee_amounts ON dossiers_cee;
    DROP TRIGGER IF EXISTS trigger_generate_dossier_reference ON dossiers_cee;
  END IF;
  
  -- Supprimer triggers sur prospects (si table existe)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prospects') THEN
    DROP TRIGGER IF EXISTS trigger_prospects_updated_at ON prospects;
  END IF;
  
  RAISE NOTICE '✓ Triggers supprimés (si existaient)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Note: Erreur suppression triggers ignorée: %', SQLERRM;
END $$;

-- Supprimer les fonctions
DO $$
BEGIN
  DROP FUNCTION IF EXISTS increment_email_opens();
  DROP FUNCTION IF EXISTS calculate_cee_amounts();
  DROP FUNCTION IF EXISTS generate_dossier_reference();
  DROP FUNCTION IF EXISTS update_updated_at_column();
  DROP FUNCTION IF EXISTS calc_kwh_cumac(DECIMAL);
  DROP FUNCTION IF EXISTS calc_prime_cee(INTEGER);
  RAISE NOTICE '✓ Fonctions supprimées (si existaient)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Note: Erreur suppression fonctions ignorée: %', SQLERRM;
END $$;

-- ############################################################################
-- ÉTAPE 3: SUPPRESSION SÉCURISÉE DES TABLES
-- ############################################################################

DO $$
BEGIN
  -- Supprimer dans l'ordre inverse des dépendances FK
  DROP TABLE IF EXISTS packs_documents CASCADE;
  DROP TABLE IF EXISTS email_logs CASCADE;
  DROP TABLE IF EXISTS dossiers_cee CASCADE;
  DROP TABLE IF EXISTS prospects CASCADE;
  RAISE NOTICE '✓ Tables supprimées (si existaient)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Note: Erreur suppression tables ignorée: %', SQLERRM;
END $$;

-- ############################################################################
-- ÉTAPE 4: EXTENSION
-- ############################################################################

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ############################################################################
-- ÉTAPE 5: CRÉATION DES TABLES (IF NOT EXISTS)
-- ############################################################################

-- ----------------------------------------------------------------------------
-- TABLE 1: PROSPECTS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Entreprise
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
  
  -- Contact
  contact_nom VARCHAR(255),
  contact_prenom VARCHAR(255),
  contact_fonction VARCHAR(100),
  
  -- SCORING IA (colonne importante)
  score_pertinence INTEGER DEFAULT 0,
  fiche_cee_recommandee VARCHAR(20) DEFAULT 'IND-UT-102',
  potentiel_prime DECIMAL(10, 2) DEFAULT 0,
  
  -- Message IA
  message_ia_personnalise TEXT,
  message_genere_at TIMESTAMPTZ,
  
  -- Statut
  statut VARCHAR(50) DEFAULT 'nouveau',
  
  -- Tracking
  email_opens_count INTEGER DEFAULT 0,
  email_clicks_count INTEGER DEFAULT 0,
  derniere_ouverture_at TIMESTAMPTZ,
  dernier_clic_at TIMESTAMPTZ,
  
  -- Métadonnées
  source VARCHAR(100) DEFAULT 'prospection_ia',
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contrainte score_pertinence (ajoutée séparément pour éviter erreur si existe)
DO $$
BEGIN
  ALTER TABLE prospects ADD CONSTRAINT chk_score_pertinence 
    CHECK (score_pertinence >= 0 AND score_pertinence <= 100);
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Contrainte chk_score_pertinence existe déjà';
END $$;

-- Contrainte unique SIRET
DO $$
BEGIN
  ALTER TABLE prospects ADD CONSTRAINT prospects_siret_unique UNIQUE (siret);
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Contrainte prospects_siret_unique existe déjà';
END $$;

-- ----------------------------------------------------------------------------
-- TABLE 2: DOSSIERS_CEE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS dossiers_cee (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(50) UNIQUE,
  
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
  
  -- Données IND-UT-102
  fiche_operation VARCHAR(20) DEFAULT 'IND-UT-102',
  puissance_kw DECIMAL(10, 2) DEFAULT 25.00,
  type_moteur VARCHAR(100) DEFAULT 'Moteur asynchrone IE3',
  presence_variateur BOOLEAN DEFAULT true,
  duree_fonctionnement VARCHAR(50) DEFAULT '4000-6000h',
  
  -- Calculs CEE
  kwh_cumac INTEGER DEFAULT 312500,
  prix_cee_mwh DECIMAL(10, 4) DEFAULT 9.50,
  prime_brute DECIMAL(10, 2) DEFAULT 2968.75,
  taux_frais_gestion DECIMAL(5, 4) DEFAULT 0.10,
  frais_gestion DECIMAL(10, 2) DEFAULT 296.87,
  prime_nette_client DECIMAL(10, 2) DEFAULT 2671.88,
  
  -- Statut
  statut VARCHAR(50) DEFAULT 'brouillon',
  
  -- Confiance IA
  confiance_extraction DECIMAL(3, 2) DEFAULT 0.00,
  confiance_validation DECIMAL(3, 2) DEFAULT 0.00,
  champs_a_verifier TEXT[],
  
  -- Vérification finale
  verification_finale_ok BOOLEAN DEFAULT false,
  verification_finale_at TIMESTAMPTZ,
  points_controle_passes INTEGER DEFAULT 0,
  points_controle_total INTEGER DEFAULT 7,
  
  -- Dates
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

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Liens
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  dossier_id UUID REFERENCES dossiers_cee(id) ON DELETE SET NULL,
  
  -- Campagne
  campaign_step VARCHAR(20) NOT NULL DEFAULT 'initial',
  campaign_name VARCHAR(100) DEFAULT 'prospection_cee',
  
  -- Email
  destinataire_email VARCHAR(255) NOT NULL,
  destinataire_nom VARCHAR(255),
  sujet VARCHAR(500) NOT NULL,
  corps_html TEXT,
  corps_text TEXT,
  
  -- Statut
  statut VARCHAR(20) DEFAULT 'pending',
  
  -- IDs
  resend_id VARCHAR(100),
  tracking_id VARCHAR(100) UNIQUE,
  
  -- Timestamps
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

CREATE TABLE IF NOT EXISTS packs_documents (
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
  
  -- Attestation Honneur
  ah_filename VARCHAR(255),
  ah_storage_path TEXT,
  ah_size_bytes INTEGER,
  ah_generated_at TIMESTAMPTZ,
  
  -- Mandat Délégation
  mandat_filename VARCHAR(255),
  mandat_storage_path TEXT,
  mandat_size_bytes INTEGER,
  mandat_generated_at TIMESTAMPTZ,
  
  -- ZIP
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
  
  -- Vérification
  verification_finale_passee BOOLEAN DEFAULT false,
  verification_checkpoints JSONB,
  revenu_genere DECIMAL(10, 2) DEFAULT 296.87,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ############################################################################
-- ÉTAPE 6: INDEX
-- ############################################################################

DO $$
BEGIN
  -- Index prospects
  CREATE INDEX IF NOT EXISTS idx_prospects_statut ON prospects(statut);
  CREATE INDEX IF NOT EXISTS idx_prospects_score ON prospects(score_pertinence DESC);
  CREATE INDEX IF NOT EXISTS idx_prospects_secteur ON prospects(secteur);
  CREATE INDEX IF NOT EXISTS idx_prospects_region ON prospects(region);
  CREATE INDEX IF NOT EXISTS idx_prospects_created ON prospects(created_at DESC);
  
  -- Index dossiers_cee
  CREATE INDEX IF NOT EXISTS idx_dossiers_reference ON dossiers_cee(reference);
  CREATE INDEX IF NOT EXISTS idx_dossiers_statut ON dossiers_cee(statut);
  CREATE INDEX IF NOT EXISTS idx_dossiers_prospect ON dossiers_cee(prospect_id);
  CREATE INDEX IF NOT EXISTS idx_dossiers_created ON dossiers_cee(created_at DESC);
  
  -- Index email_logs
  CREATE INDEX IF NOT EXISTS idx_emails_prospect ON email_logs(prospect_id);
  CREATE INDEX IF NOT EXISTS idx_emails_dossier ON email_logs(dossier_id);
  CREATE INDEX IF NOT EXISTS idx_emails_statut ON email_logs(statut);
  CREATE INDEX IF NOT EXISTS idx_emails_tracking ON email_logs(tracking_id);
  
  -- Index packs_documents
  CREATE INDEX IF NOT EXISTS idx_packs_dossier ON packs_documents(dossier_id);
  CREATE INDEX IF NOT EXISTS idx_packs_reference ON packs_documents(pack_reference);
  
  RAISE NOTICE '✓ Index créés';
END $$;

-- ############################################################################
-- ÉTAPE 7: FONCTIONS MÉTIER (SÉPARÉES - INDÉPENDANTES DES TABLES)
-- ############################################################################

-- Fonction utilitaire: updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction calcul kWh cumac IND-UT-102
-- Formule: puissance_kw × 12500 = kWh cumac
CREATE OR REPLACE FUNCTION calc_kwh_cumac(p_puissance DECIMAL)
RETURNS INTEGER AS $$
BEGIN
  RETURN ROUND(p_puissance * 12500)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction calcul prime CEE
-- Formule: kWh cumac / 1000 × 9.50 = prime €
CREATE OR REPLACE FUNCTION calc_prime_cee(p_kwh_cumac INTEGER, p_prix_mwh DECIMAL DEFAULT 9.50)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND((p_kwh_cumac / 1000.0) * p_prix_mwh * 100) / 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction génération référence dossier
CREATE OR REPLACE FUNCTION generate_dossier_reference()
RETURNS TRIGGER AS $$
DECLARE
  v_year VARCHAR(4);
  v_seq INTEGER;
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    v_year := TO_CHAR(NOW(), 'YYYY');
    
    SELECT COALESCE(MAX(
      CAST(NULLIF(SUBSTRING(reference FROM 'CE-' || v_year || '-(\d+)'), '') AS INTEGER)
    ), 0) + 1
    INTO v_seq
    FROM dossiers_cee
    WHERE reference LIKE 'CE-' || v_year || '-%';
    
    NEW.reference := 'CE-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction calculs CEE automatiques
CREATE OR REPLACE FUNCTION calculate_cee_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcul kWh cumac
  IF NEW.puissance_kw IS NOT NULL THEN
    NEW.kwh_cumac := calc_kwh_cumac(NEW.puissance_kw);
  END IF;
  
  -- Calcul prime brute
  IF NEW.kwh_cumac IS NOT NULL THEN
    NEW.prime_brute := calc_prime_cee(NEW.kwh_cumac, COALESCE(NEW.prix_cee_mwh, 9.50));
  END IF;
  
  -- Calcul frais et prime nette
  IF NEW.prime_brute IS NOT NULL THEN
    NEW.frais_gestion := ROUND(NEW.prime_brute * COALESCE(NEW.taux_frais_gestion, 0.10) * 100) / 100;
    NEW.prime_nette_client := ROUND((NEW.prime_brute - NEW.frais_gestion) * 100) / 100;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction compteur ouvertures email
CREATE OR REPLACE FUNCTION increment_email_opens()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut = 'opened' AND (OLD.statut IS NULL OR OLD.statut != 'opened') THEN
    NEW.open_count := COALESCE(OLD.open_count, 0) + 1;
    NEW.opened_at := COALESCE(NEW.opened_at, NOW());
    
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

-- ############################################################################
-- ÉTAPE 8: TRIGGERS (APRÈS TABLES ET FONCTIONS)
-- ############################################################################

DO $$
BEGIN
  -- Triggers updated_at
  DROP TRIGGER IF EXISTS trigger_prospects_updated_at ON prospects;
  CREATE TRIGGER trigger_prospects_updated_at
    BEFORE UPDATE ON prospects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  DROP TRIGGER IF EXISTS trigger_dossiers_cee_updated_at ON dossiers_cee;
  CREATE TRIGGER trigger_dossiers_cee_updated_at
    BEFORE UPDATE ON dossiers_cee
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  DROP TRIGGER IF EXISTS trigger_email_logs_updated_at ON email_logs;
  CREATE TRIGGER trigger_email_logs_updated_at
    BEFORE UPDATE ON email_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  DROP TRIGGER IF EXISTS trigger_packs_documents_updated_at ON packs_documents;
  CREATE TRIGGER trigger_packs_documents_updated_at
    BEFORE UPDATE ON packs_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  -- Triggers métier dossiers_cee
  DROP TRIGGER IF EXISTS trigger_generate_dossier_reference ON dossiers_cee;
  CREATE TRIGGER trigger_generate_dossier_reference
    BEFORE INSERT ON dossiers_cee
    FOR EACH ROW EXECUTE FUNCTION generate_dossier_reference();
  
  DROP TRIGGER IF EXISTS trigger_calculate_cee_amounts ON dossiers_cee;
  CREATE TRIGGER trigger_calculate_cee_amounts
    BEFORE INSERT OR UPDATE ON dossiers_cee
    FOR EACH ROW EXECUTE FUNCTION calculate_cee_amounts();
  
  -- Trigger email opens
  DROP TRIGGER IF EXISTS trigger_increment_email_opens ON email_logs;
  CREATE TRIGGER trigger_increment_email_opens
    BEFORE UPDATE ON email_logs
    FOR EACH ROW EXECUTE FUNCTION increment_email_opens();
  
  RAISE NOTICE '✓ Triggers créés';
END $$;

-- ############################################################################
-- ÉTAPE 9: RLS (Row Level Security)
-- ############################################################################

DO $$
BEGIN
  -- Activer RLS
  ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
  ALTER TABLE dossiers_cee ENABLE ROW LEVEL SECURITY;
  ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE packs_documents ENABLE ROW LEVEL SECURITY;
  
  -- Supprimer anciennes politiques si existent
  DROP POLICY IF EXISTS service_role_prospects ON prospects;
  DROP POLICY IF EXISTS service_role_dossiers_cee ON dossiers_cee;
  DROP POLICY IF EXISTS service_role_email_logs ON email_logs;
  DROP POLICY IF EXISTS service_role_packs_documents ON packs_documents;
  
  -- Créer politiques service_role
  CREATE POLICY service_role_prospects ON prospects
    FOR ALL USING (auth.role() = 'service_role');
  
  CREATE POLICY service_role_dossiers_cee ON dossiers_cee
    FOR ALL USING (auth.role() = 'service_role');
  
  CREATE POLICY service_role_email_logs ON email_logs
    FOR ALL USING (auth.role() = 'service_role');
  
  CREATE POLICY service_role_packs_documents ON packs_documents
    FOR ALL USING (auth.role() = 'service_role');
  
  RAISE NOTICE '✓ RLS configuré';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Note RLS: %', SQLERRM;
END $$;

-- ############################################################################
-- ÉTAPE 10: VUES (APRÈS TOUT LE RESTE)
-- ############################################################################

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

CREATE OR REPLACE VIEW v_stats_prospection AS
SELECT 
  statut,
  COUNT(*) AS nombre,
  ROUND(AVG(score_pertinence), 0) AS score_moyen,
  SUM(potentiel_prime) AS potentiel_total
FROM prospects
GROUP BY statut;

CREATE OR REPLACE VIEW v_stats_email_campaign AS
SELECT 
  campaign_step,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE statut IN ('opened', 'clicked')) AS ouverts,
  ROUND(100.0 * COUNT(*) FILTER (WHERE statut IN ('opened', 'clicked')) / NULLIF(COUNT(*), 0), 1) AS taux_ouverture
FROM email_logs
WHERE statut != 'pending'
GROUP BY campaign_step;

-- ############################################################################
-- ÉTAPE 11: TEST D'INSERTION - VÉRIFICATION score_pertinence
-- ############################################################################

DO $$
DECLARE
  v_prospect_id UUID;
  v_score INTEGER;
  v_kwh INTEGER;
  v_prime DECIMAL;
BEGIN
  -- Test 1: Insérer un prospect fictif avec score_pertinence
  INSERT INTO prospects (
    raison_sociale,
    siret,
    secteur,
    ville,
    email,
    score_pertinence,
    potentiel_prime,
    statut
  ) VALUES (
    'TEST_Fonderie Martin SAS',
    '99999999999999',
    'Maintenance Industrielle',
    'Lyon',
    'test@fonderie-martin.fr',
    95,
    2968.75,
    'nouveau'
  ) RETURNING id, score_pertinence INTO v_prospect_id, v_score;
  
  -- Vérifier que score_pertinence fonctionne
  IF v_score = 95 THEN
    RAISE NOTICE '✅ TEST 1 RÉUSSI: Insertion prospect avec score_pertinence = %', v_score;
  ELSE
    RAISE EXCEPTION '❌ TEST 1 ÉCHOUÉ: score_pertinence attendu 95, obtenu %', v_score;
  END IF;
  
  -- Test 2: Vérifier les calculs IND-UT-102
  v_kwh := calc_kwh_cumac(25.00);
  v_prime := calc_prime_cee(v_kwh);
  
  IF v_kwh = 312500 AND v_prime = 2968.75 THEN
    RAISE NOTICE '✅ TEST 2 RÉUSSI: 25 kW → % kWh cumac → % €', v_kwh, v_prime;
  ELSE
    RAISE EXCEPTION '❌ TEST 2 ÉCHOUÉ: attendu 312500/2968.75, obtenu %/%', v_kwh, v_prime;
  END IF;
  
  -- Supprimer le prospect de test
  DELETE FROM prospects WHERE id = v_prospect_id;
  RAISE NOTICE '✓ Prospect de test supprimé';
  
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════';
  RAISE NOTICE '  🎉 TOUS LES TESTS RÉUSSIS - BASE PRÊTE !';
  RAISE NOTICE '══════════════════════════════════════════════════';
  
END $$;

-- ############################################################################
-- RÉSUMÉ FINAL
-- ############################################################################

SELECT 
  '🚀 Script de réparation exécuté avec succès !' AS message,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('prospects', 'dossiers_cee', 'email_logs', 'packs_documents')) AS tables_creees,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'score_pertinence') AS colonne_score_ok;
