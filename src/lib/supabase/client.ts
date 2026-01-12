import { createBrowserClient } from '@supabase/ssr';

// ═══════════════════════════════════════════════════════════════
// CLIENT SUPABASE - CAPITAL ÉNERGIE
// ═══════════════════════════════════════════════════════════════
// Variables d'environnement requises dans .env.local :
// - NEXT_PUBLIC_SUPABASE_URL
// - NEXT_PUBLIC_SUPABASE_ANON_KEY
// ═══════════════════════════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createBrowserClient(
  supabaseUrl.trim(),
  supabaseAnonKey.trim(),
  {
    cookieOptions: {
      path: '/',
      sameSite: 'lax' as const,
      secure: true,
    },
  }
);

// Status de connexion pour diagnostic
export const supabaseStatus = {
  hasUrl: !!supabaseUrl && supabaseUrl.length > 10,
  hasKey: !!supabaseAnonKey && supabaseAnonKey.length > 10,
  urlLength: supabaseUrl.length,
  keyLength: supabaseAnonKey.length,
  isConfigured: !!supabaseUrl && supabaseUrl.length > 10 && !!supabaseAnonKey && supabaseAnonKey.length > 10,
};

// Test de connexion à la base de données
export const testConnection = async (): Promise<boolean> => {
  if (!supabaseStatus.isConfigured) {
    console.warn('⚠️ Supabase non configuré - Variables d\'environnement manquantes');
    return false;
  }
  
  try {
    const { error } = await supabase.from('companies').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erreur connexion Supabase:', error.message);
      return false;
    }
    console.log('✅ Base de données CAPITAL ÉNERGIE connectée');
    return true;
  } catch (err) {
    console.error('❌ Erreur connexion Supabase:', err);
    return false;
  }
};

export default supabase;
