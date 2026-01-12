'use client';

import { useEffect } from 'react';
import { testConnection, supabaseStatus } from '@/lib/supabase/client';

export default function SupabaseInit() {
  useEffect(() => {
    // Test de connexion au démarrage
    const initSupabase = async () => {
      if (supabaseStatus.isConfigured) {
        await testConnection();
      } else {
        console.warn('⚠️ CAPITAL ÉNERGIE - Configuration Supabase requise');
        console.warn('   Créez un fichier .env.local avec:');
        console.warn('   NEXT_PUBLIC_SUPABASE_URL=votre_url');
        console.warn('   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé');
      }
    };

    initSupabase();
  }, []);

  return null;
}
