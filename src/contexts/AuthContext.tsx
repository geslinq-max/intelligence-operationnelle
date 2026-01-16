'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { isAdminEmail, type UserRole, ADMIN_ROUTES, USER_ROUTES } from '@/lib/auth/role-config';

// ============================================================================
// TYPES - MODÈLE SOLO-FONDATEUR
// ============================================================================

export type { UserRole } from '@/lib/auth/role-config';

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
  isAdmin: boolean;
}

// ============================================================================
// CONFIGURATION DES RÔLES (SIMPLIFIÉ)
// ============================================================================

export const ROLE_CONFIG: Record<UserRole, {
  label: string;
  description: string;
  homeRoute: string;
  color: string;
  icon: string;
}> = {
  admin: {
    label: 'Administrateur',
    description: 'Tableau de bord complet - Gestion clients et statistiques',
    homeRoute: '/admin',
    color: 'text-amber-400',
    icon: '👑',
  },
  artisan: {
    label: 'Artisan',
    description: 'Espace client - Dépôt et suivi de dossiers',
    homeRoute: '/dashboard',
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

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser && authUser.email) {
          const role: UserRole = isAdminEmail(authUser.email) ? 'admin' : 'artisan';
          
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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
      } else if (session?.user?.email) {
        const role: UserRole = isAdminEmail(session.user.email) ? 'admin' : 'artisan';
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

  const hasAccess = useCallback((requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (isAdminEmail(user.email)) return true;
    
    return roles.includes(user.role);
  }, [user]);

  const getHomeRoute = useCallback((): string => {
    if (!user) return '/login';
    if (isAdminEmail(user.email)) return '/admin';
    return '/dashboard';
  }, [user]);

  const isAdmin = user ? isAdminEmail(user.email) : false;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      logout,
      hasAccess,
      getHomeRoute,
      isAdmin,
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
  const { user, isLoading, hasAccess, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
        return;
      }
      
      if (isAdmin) return;
      
      if (!hasAccess(allowedRoles)) {
        router.replace('/403');
      }
    }
  }, [user, isLoading, hasAccess, allowedRoles, router, isAdmin]);

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

  if (isAdmin) {
    return <>{children}</>;
  }

  if (!hasAccess(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}
