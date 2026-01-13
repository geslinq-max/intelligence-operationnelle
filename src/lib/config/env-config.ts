/**
 * Configuration des Variables d'Environnement
 * 
 * Gère la détection automatique du mode Simulation/Réel
 * selon la présence des clés API.
 * 
 * Variables requises dans .env.local :
 * - NEXT_PUBLIC_GEMINI_API_KEY : Clé API Gemini (extraction IA)
 * - RESEND_API_KEY : Clé API Resend (envoi emails)
 * - NEXT_PUBLIC_SUPABASE_URL : URL Supabase
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY : Clé publique Supabase
 */

// ============================================================================
// TYPES
// ============================================================================

export type AgentMode = 'REAL' | 'SIMULATION';

export interface AgentConfig {
  name: string;
  mode: AgentMode;
  apiKey?: string;
  isConfigured: boolean;
}

// ============================================================================
// DÉTECTION DES CLÉS API
// ============================================================================

function isKeyPresent(key: string | undefined): boolean {
  return typeof key === 'string' && key.trim().length > 0 && !key.startsWith('your_');
}

// ============================================================================
// CONFIGURATION DES AGENTS
// ============================================================================

export const GEMINI_CONFIG: AgentConfig = {
  name: 'CEE-Extractor',
  mode: isKeyPresent(process.env.NEXT_PUBLIC_GEMINI_API_KEY) ? 'REAL' : 'SIMULATION',
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  isConfigured: isKeyPresent(process.env.NEXT_PUBLIC_GEMINI_API_KEY),
};

export const RESEND_CONFIG: AgentConfig = {
  name: 'CEE-Mailer',
  mode: isKeyPresent(process.env.RESEND_API_KEY) ? 'REAL' : 'SIMULATION',
  apiKey: process.env.RESEND_API_KEY,
  isConfigured: isKeyPresent(process.env.RESEND_API_KEY),
};

export const SUPABASE_CONFIG: AgentConfig = {
  name: 'Database',
  mode: isKeyPresent(process.env.NEXT_PUBLIC_SUPABASE_URL) ? 'REAL' : 'SIMULATION',
  isConfigured: isKeyPresent(process.env.NEXT_PUBLIC_SUPABASE_URL) && 
                isKeyPresent(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
};

// ============================================================================
// LOGGING DU STATUT
// ============================================================================

let hasLoggedStatus = false;

export function logAgentStatus(): void {
  if (hasLoggedStatus) return;
  hasLoggedStatus = true;
  // Logging silencieux en production
}

// ============================================================================
// HELPER POUR LES AGENTS
// ============================================================================

export function getAgentMode(agentName: 'extractor' | 'mailer' | 'database'): AgentMode {
  switch (agentName) {
    case 'extractor':
      return GEMINI_CONFIG.mode;
    case 'mailer':
      return RESEND_CONFIG.mode;
    case 'database':
      return SUPABASE_CONFIG.mode;
  }
}

export function isRealMode(agentName: 'extractor' | 'mailer' | 'database'): boolean {
  return getAgentMode(agentName) === 'REAL';
}

// ============================================================================
// TEMPLATE .env.local
// ============================================================================

export const ENV_TEMPLATE = `
# ══════════════════════════════════════════════════════════════
# CAPITAL ÉNERGIE - Configuration des API
# ══════════════════════════════════════════════════════════════
# Copiez ce contenu dans un fichier .env.local à la racine du projet

# Gemini API (extraction IA des devis)
# Obtenez votre clé sur : https://makersuite.google.com/app/apikey
NEXT_PUBLIC_GEMINI_API_KEY=

# Resend API (envoi automatique d'emails)
# Obtenez votre clé sur : https://resend.com/api-keys
RESEND_API_KEY=

# Supabase (base de données)
# Obtenez vos clés sur : https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
`;
