'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type SubscriptionTier = 'prospect' | 'essentiel' | 'serenite' | 'expert';

export interface SubscriptionConfig {
  id: SubscriptionTier;
  nom: string;
  prix: number;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
  icon: string;
  features: {
    maxDossiers: number | 'illimite';
    maxAcces: number | 'illimite';
    vitesse: 'standard' | 'flash';
    accompagnementFondateur: boolean;
    rapportsPDF: boolean;
  };
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionConfig> = {
  prospect: {
    id: 'prospect',
    nom: 'Prospect',
    prix: 0,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    borderColor: 'border-slate-500/30',
    gradient: 'from-slate-500 to-slate-600',
    icon: '👤',
    features: {
      maxDossiers: 1,
      maxAcces: 1,
      vitesse: 'standard',
      accompagnementFondateur: false,
      rapportsPDF: false,
    },
  },
  essentiel: {
    id: 'essentiel',
    nom: 'Essentiel',
    prix: 149,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    gradient: 'from-blue-500 to-cyan-600',
    icon: '🛡️',
    features: {
      maxDossiers: 3,
      maxAcces: 1,
      vitesse: 'flash',
      accompagnementFondateur: false,
      rapportsPDF: true,
    },
  },
  serenite: {
    id: 'serenite',
    nom: 'Sérénité',
    prix: 349,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    gradient: 'from-emerald-500 to-teal-600',
    icon: '⚡',
    features: {
      maxDossiers: 15,
      maxAcces: 2,
      vitesse: 'flash',
      accompagnementFondateur: false,
      rapportsPDF: true,
    },
  },
  expert: {
    id: 'expert',
    nom: 'Expert',
    prix: 860,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/30',
    gradient: 'from-violet-500 to-purple-600',
    icon: '👑',
    features: {
      maxDossiers: 'illimite',
      maxAcces: 'illimite',
      vitesse: 'flash',
      accompagnementFondateur: true,
      rapportsPDF: true,
    },
  },
};

// ============================================================================
// CONTEXT
// ============================================================================

interface SubscriptionContextType {
  tier: SubscriptionTier;
  config: SubscriptionConfig;
  setTier: (tier: SubscriptionTier) => void;
  activatedAt: string | null;
  canAccessFeature: (feature: keyof SubscriptionConfig['features']) => boolean;
  isUpgradeAvailable: (targetTier: SubscriptionTier) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [tier, setTierState] = useState<SubscriptionTier>('prospect');
  const [activatedAt, setActivatedAt] = useState<string | null>(null);

  useEffect(() => {
    // Charger l'abonnement depuis localStorage
    const savedTier = localStorage.getItem('ce-subscription-tier') as SubscriptionTier;
    const savedActivatedAt = localStorage.getItem('ce-subscription-activated-at');
    
    if (savedTier && SUBSCRIPTION_TIERS[savedTier]) {
      setTierState(savedTier);
    }
    if (savedActivatedAt) {
      setActivatedAt(savedActivatedAt);
    }
  }, []);

  const setTier = (newTier: SubscriptionTier) => {
    setTierState(newTier);
    const now = new Date().toISOString();
    setActivatedAt(now);
    localStorage.setItem('ce-subscription-tier', newTier);
    localStorage.setItem('ce-subscription-activated-at', now);
  };

  const canAccessFeature = (feature: keyof SubscriptionConfig['features']): boolean => {
    const config = SUBSCRIPTION_TIERS[tier];
    const value = config.features[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    if (value === 'illimite') return true;
    return false;
  };

  const isUpgradeAvailable = (targetTier: SubscriptionTier): boolean => {
    const tierOrder: SubscriptionTier[] = ['prospect', 'essentiel', 'serenite', 'expert'];
    return tierOrder.indexOf(targetTier) > tierOrder.indexOf(tier);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        config: SUBSCRIPTION_TIERS[tier],
        setTier,
        activatedAt,
        canAccessFeature,
        isUpgradeAvailable,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
