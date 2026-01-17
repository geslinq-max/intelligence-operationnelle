-- ============================================================================
-- MIGRATION 005: Radar de Prospection - Colonnes Google Places
-- ============================================================================
-- Ajoute les colonnes nécessaires pour le module Radar de Prospection
-- Logique Upsert basée sur place_id Google Places

-- Ajouter la colonne place_id (identifiant Google Places unique)
ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS place_id VARCHAR(255) UNIQUE;

-- Ajouter les colonnes Pain Signals
ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS pain_score INTEGER DEFAULT 0 CHECK (pain_score >= 0 AND pain_score <= 100);

ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(50) DEFAULT 'NORMAL' CHECK (
  urgency_level IN ('URGENCE_HAUTE', 'URGENCE_MOYENNE', 'NORMAL', 'UNKNOWN')
);

ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS pain_summary TEXT;

ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS top_issues TEXT[];

-- Ajouter les colonnes Google Places
ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS note_google DECIMAL(2, 1);

ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS nombre_avis INTEGER DEFAULT 0;

ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);

ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS activite_principale VARCHAR(255);

ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS activites_secondaires TEXT[];

ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS fiches_cee_potentielles TEXT[];

-- Index pour recherche rapide par place_id
CREATE INDEX IF NOT EXISTS idx_prospects_place_id ON prospects(place_id);

-- Index pour tri par pain_score (prospects à haut potentiel)
CREATE INDEX IF NOT EXISTS idx_prospects_pain_score ON prospects(pain_score DESC);

-- Index pour recherche par urgency_level
CREATE INDEX IF NOT EXISTS idx_prospects_urgency ON prospects(urgency_level);

-- Commentaires
COMMENT ON COLUMN prospects.place_id IS 'Identifiant unique Google Places pour logique Upsert';
COMMENT ON COLUMN prospects.pain_score IS 'Score de détresse administrative (0-100) calculé par PainSignalsEngine';
COMMENT ON COLUMN prospects.urgency_level IS 'Niveau d''urgence: URGENCE_HAUTE, URGENCE_MOYENNE, NORMAL, UNKNOWN';
COMMENT ON COLUMN prospects.note_google IS 'Note moyenne Google Places (1.0-5.0)';
