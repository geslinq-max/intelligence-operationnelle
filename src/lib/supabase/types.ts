/**
 * Types de la Base de Données Supabase
 * 
 * Ce fichier définit la structure de nos tables.
 * Il sera auto-généré plus tard avec `supabase gen types`
 */

export type Database = {
  public: {
    Tables: {
      entreprises: {
        Row: {
          id: string;
          created_at: string;
          raison_sociale: string;
          siret: string;
          secteur_activite: string;
          taille: 'TPE' | 'PME' | 'ETI';
          adresse: string | null;
          contact_email: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          raison_sociale: string;
          siret: string;
          secteur_activite: string;
          taille: 'TPE' | 'PME' | 'ETI';
          adresse?: string | null;
          contact_email?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          raison_sociale?: string;
          siret?: string;
          secteur_activite?: string;
          taille?: 'TPE' | 'PME' | 'ETI';
          adresse?: string | null;
          contact_email?: string | null;
        };
      };
      rapports_scout: {
        Row: {
          id: string;
          created_at: string;
          entreprise_id: string;
          donnees_energie: object;
          donnees_logistique: object;
          anomalies: object[];
          statut: 'en_cours' | 'termine' | 'erreur';
        };
        Insert: {
          id?: string;
          created_at?: string;
          entreprise_id: string;
          donnees_energie?: object;
          donnees_logistique?: object;
          anomalies?: object[];
          statut?: 'en_cours' | 'termine' | 'erreur';
        };
        Update: {
          id?: string;
          created_at?: string;
          entreprise_id?: string;
          donnees_energie?: object;
          donnees_logistique?: object;
          anomalies?: object[];
          statut?: 'en_cours' | 'termine' | 'erreur';
        };
      };
      plans_optimisation: {
        Row: {
          id: string;
          created_at: string;
          entreprise_id: string;
          rapport_scout_id: string;
          actions: object[];
          roi_estime: object;
          priorite: 'basse' | 'moyenne' | 'haute' | 'urgente';
          statut: 'brouillon' | 'valide' | 'en_cours' | 'termine';
        };
        Insert: {
          id?: string;
          created_at?: string;
          entreprise_id: string;
          rapport_scout_id: string;
          actions?: object[];
          roi_estime?: object;
          priorite?: 'basse' | 'moyenne' | 'haute' | 'urgente';
          statut?: 'brouillon' | 'valide' | 'en_cours' | 'termine';
        };
        Update: {
          id?: string;
          created_at?: string;
          entreprise_id?: string;
          rapport_scout_id?: string;
          actions?: object[];
          roi_estime?: object;
          priorite?: 'basse' | 'moyenne' | 'haute' | 'urgente';
          statut?: 'brouillon' | 'valide' | 'en_cours' | 'termine';
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
