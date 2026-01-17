'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

// ============================================================================
// TYPES - MODES MÉTIER
// ============================================================================

export type IndustryMode = 'ARTISAN_CEE' | 'VITICULTURE' | 'PAYSAGISTE_DEMOLITION';

export interface IndustryConfig {
  id: IndustryMode;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  radarDefaultMetier: string;
  dashboardModules: string[];
}

// ============================================================================
// CONFIGURATION DES MODES MÉTIER
// ============================================================================

export const INDUSTRY_CONFIGS: Record<IndustryMode, IndustryConfig> = {
  ARTISAN_CEE: {
    id: 'ARTISAN_CEE',
    label: 'Artisans CEE',
    shortLabel: 'CEE',
    description: 'Suivi des dossiers CEE et primes énergie',
    icon: '⚡',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/40',
    radarDefaultMetier: 'Électricien Plombier Chauffagiste',
    dashboardModules: ['dossiers_cee', 'primes', 'artisans', 'statistiques_cee'],
  },
  VITICULTURE: {
    id: 'VITICULTURE',
    label: 'Viticulture',
    shortLabel: 'Viti',
    description: 'Registre phytosanitaire et contrats saisonniers',
    icon: '🍇',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/40',
    radarDefaultMetier: 'Viticulteur Domaine viticole Cave',
    dashboardModules: ['registre_phyto', 'contrats_saisonniers', 'parcelles', 'traitements'],
  },
  PAYSAGISTE_DEMOLITION: {
    id: 'PAYSAGISTE_DEMOLITION',
    label: 'Paysagiste / Démolition',
    shortLabel: 'BSD',
    description: 'Suivi des déchets BSD/Trackdéchets',
    icon: '🌳',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/40',
    radarDefaultMetier: 'Paysagiste Espaces verts Démolition',
    dashboardModules: ['bsd_dechets', 'trackdechets', 'chantiers', 'bordereaux'],
  },
};

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface IndustryContextType {
  currentMode: IndustryMode;
  config: IndustryConfig;
  setMode: (mode: IndustryMode) => void;
  isTransitioning: boolean;
  allModes: IndustryConfig[];
}

const IndustryContext = createContext<IndustryContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function IndustryProvider({ children }: { children: React.ReactNode }) {
  const [currentMode, setCurrentMode] = useState<IndustryMode>('ARTISAN_CEE');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Charger la préférence depuis localStorage au montage
  useEffect(() => {
    const loadPreference = async () => {
      try {
        // D'abord essayer localStorage pour réponse instantanée
        const localPref = localStorage.getItem('industry_mode');
        if (localPref && Object.keys(INDUSTRY_CONFIGS).includes(localPref)) {
          setCurrentMode(localPref as IndustryMode);
        }

        // Ensuite synchroniser avec Supabase (si connecté)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('industry_mode')
            .eq('user_id', user.id)
            .single();

          if (profile?.industry_mode && Object.keys(INDUSTRY_CONFIGS).includes(profile.industry_mode)) {
            setCurrentMode(profile.industry_mode as IndustryMode);
            localStorage.setItem('industry_mode', profile.industry_mode);
          }
        }
      } catch (error) {
        // Fallback silencieux - garder le mode par défaut
        console.warn('[IndustryContext] Erreur chargement préférence:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadPreference();
  }, []);

  // Fonction pour changer de mode avec transition
  const setMode = useCallback(async (mode: IndustryMode) => {
    if (mode === currentMode) return;

    setIsTransitioning(true);

    // Petit délai pour animation de transition
    await new Promise(resolve => setTimeout(resolve, 150));

    setCurrentMode(mode);
    localStorage.setItem('industry_mode', mode);

    // Sauvegarder dans Supabase (async, non-bloquant)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            industry_mode: mode,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
      }
    } catch (error) {
      console.warn('[IndustryContext] Erreur sauvegarde préférence:', error);
    }

    // Fin de la transition
    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentMode]);

  const config = INDUSTRY_CONFIGS[currentMode];
  const allModes = Object.values(INDUSTRY_CONFIGS);

  // Afficher un placeholder pendant le chargement initial
  if (!isInitialized) {
    return (
      <IndustryContext.Provider value={{
        currentMode: 'ARTISAN_CEE',
        config: INDUSTRY_CONFIGS.ARTISAN_CEE,
        setMode: () => {},
        isTransitioning: false,
        allModes,
      }}>
        {children}
      </IndustryContext.Provider>
    );
  }

  return (
    <IndustryContext.Provider value={{
      currentMode,
      config,
      setMode,
      isTransitioning,
      allModes,
    }}>
      {children}
    </IndustryContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useIndustry() {
  const context = useContext(IndustryContext);
  if (context === undefined) {
    throw new Error('useIndustry must be used within an IndustryProvider');
  }
  return context;
}

// ============================================================================
// COMPOSANT SWITCHER
// ============================================================================

interface IndustrySwitcherProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function IndustrySwitcher({ variant = 'compact', className = '' }: IndustrySwitcherProps) {
  const { currentMode, config, setMode, isTransitioning, allModes } = useIndustry();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (mode: IndustryMode) => {
    setMode(mode);
    setIsOpen(false);
  };

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isTransitioning}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-red-500 transition-all duration-300
            ${config.bgColor}
            hover:brightness-110 disabled:opacity-50
          `}
        >
          <span className="text-xl">{config.icon}</span>
          <div className="flex-1 text-left">
            <p className={`text-sm font-semibold ${config.color}`}>{config.shortLabel}</p>
            <p className="text-slate-500 text-xs truncate">{config.label}</p>
          </div>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[9999] overflow-hidden">
              {allModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleSelect(mode.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 transition-colors
                    ${mode.id === currentMode 
                      ? `${mode.bgColor} ${mode.color}` 
                      : 'text-slate-300 hover:bg-slate-700'
                    }
                  `}
                >
                  <span className="text-xl">{mode.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{mode.label}</p>
                    <p className="text-xs opacity-70">{mode.description}</p>
                  </div>
                  {mode.id === currentMode && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Variant "full" - Boutons horizontaux
  return (
    <div className={`flex gap-2 ${className}`}>
      {allModes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => setMode(mode.id)}
          disabled={isTransitioning}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300
            ${mode.id === currentMode 
              ? `${mode.bgColor} ${mode.borderColor} ${mode.color}` 
              : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
            }
            disabled:opacity-50
          `}
        >
          <span className="text-lg">{mode.icon}</span>
          <span className="font-medium text-sm">{mode.shortLabel}</span>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// WRAPPER AVEC TRANSITION
// ============================================================================

interface IndustryTransitionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function IndustryTransitionWrapper({ children, className = '' }: IndustryTransitionWrapperProps) {
  const { isTransitioning } = useIndustry();

  return (
    <div
      className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'} ${className}`}
    >
      {children}
    </div>
  );
}
