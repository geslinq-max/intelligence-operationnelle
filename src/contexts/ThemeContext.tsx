'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeVariant = 'bleu' | 'vert' | 'gris';

interface ThemeConfig {
  primary: string;
  primaryHover: string;
  gradient: string;
  accent: string;
  name: string;
}

export const THEMES: Record<ThemeVariant, ThemeConfig> = {
  bleu: {
    primary: 'from-cyan-500 to-blue-600',
    primaryHover: 'from-cyan-600 to-blue-700',
    gradient: 'from-cyan-500/20 to-blue-600/20',
    accent: 'cyan',
    name: 'Bleu Industriel',
  },
  vert: {
    primary: 'from-emerald-500 to-green-600',
    primaryHover: 'from-emerald-600 to-green-700',
    gradient: 'from-emerald-500/20 to-green-600/20',
    accent: 'emerald',
    name: 'Vert Écologie',
  },
  gris: {
    primary: 'from-slate-500 to-slate-700',
    primaryHover: 'from-slate-600 to-slate-800',
    gradient: 'from-slate-500/20 to-slate-700/20',
    accent: 'slate',
    name: 'Gris Anthracite',
  },
};

interface BrandingContextType {
  theme: ThemeVariant;
  setTheme: (theme: ThemeVariant) => void;
  themeConfig: ThemeConfig;
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  cabinetNom: string;
  setCabinetNom: (nom: string) => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeVariant>('bleu');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [cabinetNom, setCabinetNom] = useState<string>('');

  useEffect(() => {
    // Charger les préférences depuis localStorage
    const savedTheme = localStorage.getItem('io-theme') as ThemeVariant;
    const savedLogo = localStorage.getItem('io-logo');
    const savedCabinet = localStorage.getItem('io-cabinet');
    
    if (savedTheme && THEMES[savedTheme]) {
      setThemeState(savedTheme);
    }
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
    if (savedCabinet) {
      setCabinetNom(savedCabinet);
    }
  }, []);

  const setTheme = (newTheme: ThemeVariant) => {
    setThemeState(newTheme);
    localStorage.setItem('io-theme', newTheme);
  };

  const handleSetLogoUrl = (url: string | null) => {
    setLogoUrl(url);
    if (url) {
      localStorage.setItem('io-logo', url);
    } else {
      localStorage.removeItem('io-logo');
    }
  };

  const handleSetCabinetNom = (nom: string) => {
    setCabinetNom(nom);
    localStorage.setItem('io-cabinet', nom);
  };

  return (
    <BrandingContext.Provider
      value={{
        theme,
        setTheme,
        themeConfig: THEMES[theme],
        logoUrl,
        setLogoUrl: handleSetLogoUrl,
        cabinetNom,
        setCabinetNom: handleSetCabinetNom,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
