-- ═══════════════════════════════════════════════════════════════
-- CAPITAL ÉNERGIE - Schéma de Base de Données Supabase
-- ═══════════════════════════════════════════════════════════════
-- Date: 2026-01-10
-- Description: Tables principales pour la gestion des entreprises
--              et des rapports CEE
-- ═══════════════════════════════════════════════════════════════

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
-- TABLE: companies (Entreprises clientes)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  siret VARCHAR(17) NOT NULL UNIQUE,
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(10),
  sector VARCHAR(100),
  naf_code VARCHAR(10),
  employee_count VARCHAR(50),
  email VARCHAR(255),
  phone VARCHAR(20),
  contact_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'prospect',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide par SIRET
CREATE INDEX IF NOT EXISTS idx_companies_siret ON companies(siret);
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: reports (Rapports d'analyse CEE)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL DEFAULT 'scout',
  title VARCHAR(255),
  total_cee DECIMAL(12, 2) DEFAULT 0,
  total_savings DECIMAL(12, 2) DEFAULT 0,
  total_investment DECIMAL(12, 2) DEFAULT 0,
  roi_months INTEGER,
  roi_5y DECIMAL(12, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'brouillon',
  pdf_url TEXT,
  sent_to_crm BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  commission_rate DECIMAL(5, 2) DEFAULT 10.00,
  commission_amount DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche par entreprise et statut
CREATE INDEX IF NOT EXISTS idx_reports_company ON reports(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: report_actions (Actions du plan d'optimisation)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS report_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  domain VARCHAR(50),
  implementation_cost DECIMAL(12, 2) DEFAULT 0,
  annual_savings DECIMAL(12, 2) DEFAULT 0,
  cee_fiche VARCHAR(50),
  status VARCHAR(50) DEFAULT 'etude',
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actions_report ON report_actions(report_id);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: subsidies (Subventions identifiées)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS subsidies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  estimated_amount DECIMAL(12, 2) DEFAULT 0,
  coverage_percent DECIMAL(5, 2) DEFAULT 0,
  eligibility_status VARCHAR(50) DEFAULT 'eligible',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subsidies_report ON subsidies(report_id);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER: Mise à jour automatique de updated_at
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidies ENABLE ROW LEVEL SECURITY;

-- Politique: Lecture publique pour les utilisateurs authentifiés
CREATE POLICY "Allow authenticated read" ON companies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON companies
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON companies
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read reports" ON reports
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert reports" ON reports
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update reports" ON reports
  FOR UPDATE TO authenticated USING (true);

-- ═══════════════════════════════════════════════════════════════
-- DONNÉES DE TEST (optionnel)
-- ═══════════════════════════════════════════════════════════════
-- INSERT INTO companies (name, siret, address, city, sector) VALUES
-- ('Métallurgie Dupont SARL', '12345678900012', '15 Rue de l''Industrie', 'Lyon', 'Métallurgie'),
-- ('Plasturgie Ouest', '98765432100034', '8 Avenue des Technologies', 'Nantes', 'Plasturgie');
