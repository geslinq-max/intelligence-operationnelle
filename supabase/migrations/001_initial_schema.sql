-- ============================================
-- Intelligence Opérationnelle - Schema Initial
-- Architecture Hybride (Option C)
-- ============================================

-- Table 1: ENTREPRISES (clients PME)
-- Données structurées pour les infos de base
CREATE TABLE entreprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Infos légales (structuré)
  raison_sociale TEXT NOT NULL,
  siret VARCHAR(14) NOT NULL UNIQUE,
  siren VARCHAR(9),
  
  -- Classification (structuré)
  secteur_activite TEXT NOT NULL,
  code_naf VARCHAR(10),
  taille VARCHAR(10) CHECK (taille IN ('TPE', 'PME', 'ETI')),
  effectif INTEGER,
  chiffre_affaires DECIMAL(15,2),
  
  -- Localisation (structuré)
  adresse TEXT,
  code_postal VARCHAR(10),
  ville TEXT,
  pays TEXT DEFAULT 'France',
  
  -- Contact principal (structuré)
  contact_nom TEXT,
  contact_email TEXT,
  contact_telephone TEXT,
  
  -- Statut client
  statut VARCHAR(20) DEFAULT 'prospect' CHECK (statut IN ('prospect', 'client_actif', 'client_inactif', 'perdu'))
);

-- Table 2: RAPPORTS_SCOUT (analyses Agent Scout)
-- Architecture HYBRIDE : colonnes structurées + JSON flexible
CREATE TABLE rapports_scout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Relation (structuré)
  entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE,
  
  -- Métadonnées (structuré)
  date_analyse DATE NOT NULL DEFAULT CURRENT_DATE,
  periode_debut DATE,
  periode_fin DATE,
  statut VARCHAR(20) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'erreur')),
  
  -- DONNÉES HYBRIDES (JSON flexible)
  -- Permet de stocker des structures variées selon le type d'entreprise
  donnees_energie JSONB DEFAULT '[]'::jsonb,
  donnees_logistique JSONB DEFAULT '[]'::jsonb,
  anomalies JSONB DEFAULT '[]'::jsonb,
  
  -- Scores calculés (structuré pour requêtes rapides)
  score_energie INTEGER CHECK (score_energie BETWEEN 0 AND 100),
  score_logistique INTEGER CHECK (score_logistique BETWEEN 0 AND 100),
  economies_potentielles DECIMAL(12,2),
  
  -- Métadonnées techniques
  version_agent VARCHAR(20) DEFAULT '1.0.0',
  duree_analyse_secondes INTEGER
);

-- Table 3: PLANS_OPTIMISATION (plans Agent Architect)
CREATE TABLE plans_optimisation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Relations (structuré)
  entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE,
  rapport_scout_id UUID REFERENCES rapports_scout(id) ON DELETE SET NULL,
  
  -- Infos plan (structuré)
  titre TEXT NOT NULL,
  description TEXT,
  priorite VARCHAR(10) DEFAULT 'moyenne' CHECK (priorite IN ('basse', 'moyenne', 'haute', 'urgente')),
  statut VARCHAR(20) DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'valide', 'en_cours', 'termine', 'abandonne')),
  
  -- DONNÉES HYBRIDES (JSON flexible)
  actions JSONB DEFAULT '[]'::jsonb,
  
  -- ROI (structuré pour analyses)
  investissement_total DECIMAL(12,2),
  economies_annuelles DECIMAL(12,2),
  temps_retour_mois INTEGER,
  
  -- Validation
  valide_par TEXT,
  date_validation TIMESTAMPTZ
);

-- Table 4: VERIFICATIONS_CONFORMITE (Agent Compliance)
CREATE TABLE verifications_conformite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Relations
  plan_id UUID REFERENCES plans_optimisation(id) ON DELETE CASCADE,
  entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE,
  
  -- Résultat global (structuré)
  est_conforme BOOLEAN DEFAULT FALSE,
  score_conformite INTEGER CHECK (score_conformite BETWEEN 0 AND 100),
  
  -- DONNÉES HYBRIDES (JSON flexible)
  normes_verifiees JSONB DEFAULT '[]'::jsonb,
  alertes JSONB DEFAULT '[]'::jsonb,
  recommandations JSONB DEFAULT '[]'::jsonb,
  
  -- Métadonnées
  version_referentiel VARCHAR(20)
);

-- Table 5: PROSPECTS (Agent Outreach)
CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Peut être converti en entreprise
  entreprise_id UUID REFERENCES entreprises(id) ON DELETE SET NULL,
  
  -- Infos prospect (structuré)
  raison_sociale TEXT NOT NULL,
  siret VARCHAR(14),
  secteur_activite TEXT,
  taille VARCHAR(10),
  
  -- Contact (structuré)
  contact_nom TEXT,
  contact_prenom TEXT,
  contact_fonction TEXT,
  contact_email TEXT,
  contact_telephone TEXT,
  contact_linkedin TEXT,
  
  -- Qualification (structuré pour tri/filtre)
  score_qualification INTEGER DEFAULT 0 CHECK (score_qualification BETWEEN 0 AND 100),
  statut VARCHAR(30) DEFAULT 'identifie' CHECK (statut IN (
    'identifie', 'contacte', 'interesse', 'en_discussion', 
    'proposition_envoyee', 'converti', 'perdu'
  )),
  
  -- Source et campagne
  source TEXT,
  campagne_id UUID,
  
  -- DONNÉES HYBRIDES (historique interactions)
  historique_interactions JSONB DEFAULT '[]'::jsonb,
  notes JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- INDEX pour performances
-- ============================================
CREATE INDEX idx_entreprises_siret ON entreprises(siret);
CREATE INDEX idx_entreprises_statut ON entreprises(statut);
CREATE INDEX idx_rapports_entreprise ON rapports_scout(entreprise_id);
CREATE INDEX idx_rapports_statut ON rapports_scout(statut);
CREATE INDEX idx_plans_entreprise ON plans_optimisation(entreprise_id);
CREATE INDEX idx_prospects_statut ON prospects(statut);
CREATE INDEX idx_prospects_score ON prospects(score_qualification DESC);

-- Index GIN pour recherche dans JSON
CREATE INDEX idx_rapports_anomalies ON rapports_scout USING GIN (anomalies);
CREATE INDEX idx_plans_actions ON plans_optimisation USING GIN (actions);

-- ============================================
-- TRIGGERS pour updated_at automatique
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_entreprises_updated
  BEFORE UPDATE ON entreprises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_plans_updated
  BEFORE UPDATE ON plans_optimisation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_prospects_updated
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (sécurité)
-- ============================================
ALTER TABLE entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapports_scout ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans_optimisation ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications_conformite ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- Politique temporaire : accès total pour les utilisateurs authentifiés
-- À affiner plus tard selon les rôles
CREATE POLICY "Accès authentifié entreprises" ON entreprises
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Accès authentifié rapports" ON rapports_scout
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Accès authentifié plans" ON plans_optimisation
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Accès authentifié conformite" ON verifications_conformite
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Accès authentifié prospects" ON prospects
  FOR ALL USING (auth.role() = 'authenticated');
