'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

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
  login: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  hasAccess: (requiredRole: UserRole | UserRole[]) => boolean;
  getHomeRoute: () => string;
}

// ============================================================================
// CONFIGURATION DES RÔLES
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
    allowedRoutes: ['/admin', '/direction', '/partenaire', '/dashboard', '/tarifs', '/entreprises', '/gestion', '/prospection', '/verificateur'],
    color: 'text-amber-400',
    icon: '👑',
  },
  manager: {
    label: 'Manager',
    cle: 'Clé Manager',
    description: 'Bras Droit - Gestion équipe commerciale',
    homeRoute: '/direction',
    allowedRoutes: ['/direction', '/partenaire', '/dashboard', '/tarifs', '/entreprises', '/gestion'],
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

// Données de démonstration pour chaque rôle
const DEMO_USERS: Record<UserRole, User> = {
  fondateur: {
    id: 'usr_fondateur_001',
    nom: 'Alexandre Dupont',
    email: 'fondateur@capital-energie.fr',
    role: 'fondateur',
    dateCreation: '2024-01-01',
  },
  manager: {
    id: 'usr_manager_001',
    nom: 'Marie Laurent',
    email: 'direction@capital-energie.fr',
    role: 'manager',
    dateCreation: '2024-03-15',
  },
  partenaire: {
    id: 'usr_partenaire_001',
    nom: 'Thomas Bernard',
    email: 'partenaire@capital-energie.fr',
    role: 'partenaire',
    dateCreation: '2024-06-01',
  },
  artisan: {
    id: 'usr_artisan_001',
    nom: 'Pierre Martin',
    email: 'artisan@capital-energie.fr',
    role: 'artisan',
    dateCreation: '2024-09-01',
  },
};

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Charger l'utilisateur depuis localStorage au montage
  useEffect(() => {
    const storedRole = localStorage.getItem('ce-user-role') as UserRole | null;
    if (storedRole && DEMO_USERS[storedRole]) {
      setUser(DEMO_USERS[storedRole]);
    }
    setIsLoading(false);
  }, []);

  // Protection des routes - redirection si accès non autorisé
  useEffect(() => {
    if (isLoading) return;
    
    // Routes publiques qui ne nécessitent pas d'authentification
    const publicRoutes = ['/', '/landing', '/login', '/mentions-legales', '/confidentialite', '/tarifs'];
    if (publicRoutes.some(route => pathname === route || pathname.startsWith('/public/'))) {
      return;
    }

    // Routes protégées par rôle
    const protectedRoutes = ['/admin', '/direction', '/partenaire'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute && user) {
      const roleConfig = ROLE_CONFIG[user.role];
      const hasAccess = roleConfig.allowedRoutes.some(route => pathname.startsWith(route));
      
      if (!hasAccess) {
        // Redirection vers l'espace autorisé
        router.replace(roleConfig.homeRoute);
      }
    }
  }, [pathname, user, isLoading, router]);

  const login = useCallback((role: UserRole) => {
    const demoUser = DEMO_USERS[role];
    setUser(demoUser);
    localStorage.setItem('ce-user-role', role);
    router.push(ROLE_CONFIG[role].homeRoute);
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('ce-user-role');
    router.push('/');
  }, [router]);

  const switchRole = useCallback((role: UserRole) => {
    login(role);
  }, [login]);

  const hasAccess = useCallback((requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Le fondateur a accès à tout
    if (user.role === 'fondateur') return true;
    
    return roles.includes(user.role);
  }, [user]);

  const getHomeRoute = useCallback((): string => {
    if (!user) return '/';
    return ROLE_CONFIG[user.role].homeRoute;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      switchRole,
      hasAccess,
      getHomeRoute,
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
  const { user, isLoading, hasAccess, getHomeRoute } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !hasAccess(allowedRoles)) {
      router.replace(getHomeRoute());
    }
  }, [user, isLoading, hasAccess, allowedRoles, router, getHomeRoute]);

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

  if (!user || !hasAccess(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}
