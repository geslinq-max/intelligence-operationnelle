'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { ClientIndustry } from '@/lib/auth/role-config';

// Types
export interface ClientProfile {
  id: string;
  email: string;
  nom: string;
  entreprise?: string;
  telephone?: string;
  ville?: string;
  role: 'admin' | 'artisan' | 'client';
  industry: ClientIndustry | null;
  statut: 'actif' | 'en_attente' | 'inactif';
  created_at: string;
  last_activity?: string;
  // KPIs calculés
  heuresGagnees: number;
  dossiersCount: number;
  bsdCount: number;
  traitementsCount: number;
}

export interface ClientStats {
  total: number;
  actifs: number;
  enAttente: number;
  parIndustrie: {
    CEE: number;
    PAYSAGISTE: number;
    VITICULTEUR: number;
  };
  totalHeuresGagnees: number;
}

interface UseAdminClientsResult {
  clients: ClientProfile[];
  stats: ClientStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Constantes pour le calcul des heures gagnées
const HEURES_PAR_DOSSIER_CEE = 2.5;
const HEURES_PAR_BSD = 1.5;
const HEURES_PAR_TRAITEMENT = 0.5;

export function useAdminClients(): UseAdminClientsResult {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    total: 0,
    actifs: 0,
    enAttente: 0,
    parIndustrie: { CEE: 0, PAYSAGISTE: 0, VITICULTEUR: 0 },
    totalHeuresGagnees: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Récupérer tous les profils clients (role = 'client')
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false });

      if (profilesError) {
        throw new Error(profilesError.message);
      }

      if (!profiles || profiles.length === 0) {
        setClients([]);
        setStats({
          total: 0,
          actifs: 0,
          enAttente: 0,
          parIndustrie: { CEE: 0, PAYSAGISTE: 0, VITICULTEUR: 0 },
          totalHeuresGagnees: 0,
        });
        setIsLoading(false);
        return;
      }

      // 2. Récupérer les KPIs pour chaque client
      const clientsWithKPIs: ClientProfile[] = await Promise.all(
        profiles.map(async (profile) => {
          // Compter les dossiers CEE
          const { count: dossiersCount } = await supabase
            .from('dossiers_cee')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          // Compter les BSD
          const { count: bsdCount } = await supabase
            .from('bsd')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          // Compter les traitements phyto
          const { count: traitementsCount } = await supabase
            .from('traitements_phyto')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          // Calculer les heures gagnées
          const heuresGagnees = 
            (dossiersCount || 0) * HEURES_PAR_DOSSIER_CEE +
            (bsdCount || 0) * HEURES_PAR_BSD +
            (traitementsCount || 0) * HEURES_PAR_TRAITEMENT;

          // Déterminer le statut basé sur l'activité
          const hasActivity = (dossiersCount || 0) + (bsdCount || 0) + (traitementsCount || 0) > 0;
          const daysSinceCreation = Math.floor(
            (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          let statut: 'actif' | 'en_attente' | 'inactif' = 'en_attente';
          if (hasActivity) {
            statut = 'actif';
          } else if (daysSinceCreation > 30) {
            statut = 'inactif';
          }

          return {
            id: profile.id,
            email: profile.email || '',
            nom: profile.nom || profile.email?.split('@')[0] || 'Client',
            entreprise: profile.entreprise || '',
            telephone: profile.telephone || '',
            ville: profile.ville || '',
            role: profile.role,
            industry: profile.industry as ClientIndustry | null,
            statut,
            created_at: profile.created_at,
            last_activity: profile.last_activity,
            heuresGagnees: Math.round(heuresGagnees * 10) / 10,
            dossiersCount: dossiersCount || 0,
            bsdCount: bsdCount || 0,
            traitementsCount: traitementsCount || 0,
          };
        })
      );

      // 3. Calculer les stats
      const newStats: ClientStats = {
        total: clientsWithKPIs.length,
        actifs: clientsWithKPIs.filter(c => c.statut === 'actif').length,
        enAttente: clientsWithKPIs.filter(c => c.statut === 'en_attente').length,
        parIndustrie: {
          CEE: clientsWithKPIs.filter(c => c.industry === 'CEE').length,
          PAYSAGISTE: clientsWithKPIs.filter(c => c.industry === 'PAYSAGISTE').length,
          VITICULTEUR: clientsWithKPIs.filter(c => c.industry === 'VITICULTEUR').length,
        },
        totalHeuresGagnees: clientsWithKPIs.reduce((sum, c) => sum + c.heuresGagnees, 0),
      };

      setClients(clientsWithKPIs);
      setStats(newStats);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des clients';
      setError(message);
      console.error('[useAdminClients] Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    stats,
    isLoading,
    error,
    refetch: fetchClients,
  };
}
