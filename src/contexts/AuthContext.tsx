'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

// ============================================================================
// 🔒 SÉCURITÉ HARD-CODED - AUCUN MOCK, AUCUN DEMO
// ============================================================================

// 🔒 EMAIL FONDATEUR - SI VIDE OU UNDEFINED, PERSONNE N'A ACCÈS FONDATEUR
const FOUNDER_EMAIL = process.env.NEXT_PUBLIC_FOUNDER_EMAIL || '';

// 🔒 Vérification stricte : si FOUNDER_EMAIL est vide, PERSONNE n'est fondateur
function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (!FOUNDER_EMAIL || FOUNDER_EMAIL.trim() === '') return false; // SÉCURITÉ: Si pas de FOUNDER_EMAIL, personne n'est fondateur
  return email.toLowerCase().trim() === FOUNDER_EMAIL.toLowerCase().trim();
}

// ============================================================================
// TYPES - RBAC CAPITAL ÉNERGIE
// ============================================================================

export type UserRole = 'fondateur' | 'manager' | 'partenaire' | 'artisan';

export interface User {
  id: string;
  nom: string;
  email: string;
  role: UserRole;
  avatar?: string;
  dateCreation: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  hasAccess: (requiredRole: UserRole | UserRole[]) => boolean;
  getHomeRoute: () => string;
  isFounder: boolean;
}

// ============================================================================
// CONFIGURATION DES RÔLES (lecture seule, pas de switchRole)
// ============================================================================

export const ROLE_CONFIG: Record<UserRole, {
  label: string;
  cle: string;
  description: string;
  homeRoute: string;
  allowedRoutes: string[];
  color: string;
  icon: string;
}> = {
  fondateur: {
    label: 'Fondateur',
    cle: 'Clé Fondateur',
    description: 'Accès au Cerveau - Vision stratégique complète',
    homeRoute: '/admin',
    allowedRoutes: ['/admin', '/admin/pilotage', '/direction', '/partenaire', '/dashboard', '/tarifs', '/entreprises', '/gestion', '/prospection', '/verificateur'],
    color: 'text-amber-400',
    icon: '👑',
  },
  manager: {
    label: 'Manager',
    cle: 'Clé Manager',
    description: 'Bras Droit - Gestion équipe commerciale',
    homeRoute: '/direction',
    allowedRoutes: ['/direction', '/admin/pilotage', '/partenaire', '/dashboard', '/tarifs', '/entreprises', '/gestion'],
    color: 'text-violet-400',
    icon: '🎯',
  },
  partenaire: {
    label: 'Partenaire',
    cle: 'Clé Soldat',
    description: 'Cockpit de Rente - Gestion clients',
    homeRoute: '/partenaire',
    allowedRoutes: ['/partenaire', '/dashboard', '/tarifs'],
    color: 'text-cyan-400',
    icon: '💼',
  },
  artisan: {
    label: 'Artisan',
    cle: 'Clé Artisan',
    description: 'Espace Opérationnel - Dépôt et suivi dossiers',
    homeRoute: '/dashboard',
    allowedRoutes: ['/dashboard', '/verificateur', '/tarifs', '/gestion'],
    color: 'text-emerald-400',
    icon: '🔧',
  },
};

// ============================================================================
// CONTEXT - BASÉ SUR SUPABASE UNIQUEMENT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // 🔒 Charger l'utilisateur UNIQUEMENT depuis Supabase Auth
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser && authUser.email) {
          // 🔒 Déterminer le rôle basé UNIQUEMENT sur l'email
          const role: UserRole = isFounderEmail(authUser.email) ? 'fondateur' : 'artisan';
          
          setUser({
            id: authUser.id,
            nom: authUser.email.split('@')[0],
            email: authUser.email,
            role: role,
            dateCreation: authUser.created_at || new Date().toISOString(),
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUser();
    
    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
      } else if (session?.user?.email) {
        const role: UserRole = isFounderEmail(session.user.email) ? 'fondateur' : 'artisan';
        setUser({
          id: session.user.id,
          nom: session.user.email.split('@')[0],
          email: session.user.email,
          role: role,
          dateCreation: session.user.created_at || new Date().toISOString(),
        });
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Protection des routes côté client (le middleware est la vraie protection)
  useEffect(() => {
    if (isLoading) return;
    
    const publicRoutes = ['/', '/landing', '/login', '/mentions-legales', '/confidentialite', '/tarifs', '/cgv', '/403'];
    if (publicRoutes.some(route => pathname === route || pathname.startsWith('/public/'))) {
      return;
    }
  }, [pathname, user, isLoading, router]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  }, [router]);

  // 🔒 hasAccess basé sur l'email réel, pas sur un rôle client-side modifiable
  const hasAccess = useCallback((requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // 🔒 Vérifier si c'est le fondateur via email HARD-CODED
    if (isFounderEmail(user.email)) return true;
    
    // Pour les autres, vérifier le rôle (toujours artisan pour les non-fondateurs)
    return roles.includes(user.role);
  }, [user]);

  const getHomeRoute = useCallback((): string => {
    if (!user) return '/login';
    if (isFounderEmail(user.email)) return '/admin';
    return '/dashboard';
  }, [user]);

  // 🔒 isFounder basé sur email réel
  const isFounder = user ? isFounderEmail(user.email) : false;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      logout,
      hasAccess,
      getHomeRoute,
      isFounder,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================================
// COMPOSANT DE PROTECTION DE ROUTE
// ============================================================================

export function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) {
  const { user, isLoading, hasAccess, getHomeRoute, isFounder } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // 🔒 Si pas d'utilisateur, rediriger vers login
      if (!user) {
        router.replace('/login');
        return;
      }
      
      // 🔒 Fondateur a toujours accès
      if (isFounder) return;
      
      // 🔒 Vérifier l'accès pour les non-fondateurs
      if (!hasAccess(allowedRoles)) {
        router.replace('/403');
      }
    }
  }, [user, isLoading, hasAccess, allowedRoles, router, getHomeRoute, isFounder]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // 🔒 Fondateur a toujours accès
  if (isFounder) {
    return <>{children}</>;
  }

  if (!hasAccess(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}
