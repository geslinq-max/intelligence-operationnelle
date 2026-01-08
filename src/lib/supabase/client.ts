/**
 * Client Supabase - Connexion à la base de données
 * 
 * Supabase est notre "cerveau de stockage" :
 * - Base de données PostgreSQL pour stocker toutes les données
 * - Authentification des utilisateurs
 * - Stockage de fichiers
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '⚠️ Variables Supabase manquantes ! Vérifie ton fichier .env.local'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export default supabase;
