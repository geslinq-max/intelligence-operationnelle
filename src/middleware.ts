import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ============================================================================
// 🔒 CONFIGURATION SÉCURITÉ - GARDIEN DES ROUTES (HARD-CODED)
// ============================================================================

const cookieOptions = {
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7,
};

// 🔒 EMAIL FONDATEUR UNIQUE - SEUL AUTORISÉ SUR /admin, /direction, /vendeur
const FOUNDER_EMAIL = process.env.NEXT_PUBLIC_FOUNDER_EMAIL || '';

// Pages publiques (pas besoin d'authentification)
const PUBLIC_PATHS = ['/', '/login', '/mentions-legales', '/confidentialite', '/landing', '/cgv', '/tarifs', '/403'];

// 🔒 ROUTES VERROUILLÉES - UNIQUEMENT FOUNDER_EMAIL
const FOUNDER_ONLY_ROUTES = ['/admin', '/direction', '/manager'];

// 🔒 ROUTES PARTENAIRES+ (fondateur, manager, partenaire)
const PARTNER_ROUTES = ['/vendeur', '/partenaire'];

// 🔒 ROUTES MANAGER+ (fondateur, manager)
const MANAGER_ROUTES = ['/prospection', '/entreprises'];

// ============================================================================
// MIDDLEWARE PRINCIPAL - GARDIEN
// ============================================================================

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === '/login';
  const isPublicPage = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`));
  
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, { ...cookieOptions, ...options });
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // ─────────────────────────────────────────────────────────────────────────
  // CAS 1: Utilisateur connecté sur la page login → rediriger
  // ─────────────────────────────────────────────────────────────────────────
  if (user && isLoginPage) {
    const { data: { session } } = await supabase.auth.getSession();
    const homeRoute = getHomeRouteForRole(user.email);
    
    if (session) {
      const redirectResponse = NextResponse.redirect(new URL(homeRoute, request.url));
      redirectResponse.cookies.set('sb-access-token', session.access_token, cookieOptions);
      redirectResponse.cookies.set('sb-refresh-token', session.refresh_token, cookieOptions);
      return redirectResponse;
    }
    return NextResponse.redirect(new URL(homeRoute, request.url));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CAS 2: Utilisateur non connecté sur page protégée → login
  // ─────────────────────────────────────────────────────────────────────────
  if (!user && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CAS 3: 🔒 GARDIEN HARD-CODED - Vérification par EMAIL sur routes protégées
  // ─────────────────────────────────────────────────────────────────────────
  if (user) {
    const userEmail = user.email?.toLowerCase().trim() || '';
    const isFounder = isFounderEmail(userEmail);
    
    // 🔒 ROUTES FONDATEUR UNIQUEMENT (/admin, /direction, /manager)
    const isFounderRoute = FOUNDER_ONLY_ROUTES.some(
      route => pathname === route || pathname.startsWith(`${route}/`)
    );
    
    if (isFounderRoute && !isFounder) {
      // 🚫 ACCÈS REFUSÉ → Redirection vers /403
      console.log(`[GARDIEN] 🚫 ACCÈS REFUSÉ: ${userEmail} → ${pathname} (FOUNDER_ONLY)`);
      return NextResponse.redirect(new URL('/403', request.url));
    }
    
    // 🔒 ROUTES MANAGER+ (/prospection, /entreprises)
    const isManagerRoute = MANAGER_ROUTES.some(
      route => pathname === route || pathname.startsWith(`${route}/`)
    );
    
    if (isManagerRoute && !isFounder) {
      // Pour l'instant, seul le fondateur peut accéder aux routes manager
      // TODO: Ajouter vérification de la table user_profiles pour les managers
      console.log(`[GARDIEN] 🚫 ACCÈS REFUSÉ: ${userEmail} → ${pathname} (MANAGER_ONLY)`);
      return NextResponse.redirect(new URL('/403', request.url));
    }
    
    // 🔒 ROUTES PARTENAIRES+ (/vendeur, /partenaire)
    const isPartnerRoute = PARTNER_ROUTES.some(
      route => pathname === route || pathname.startsWith(`${route}/`)
    );
    
    if (isPartnerRoute && !isFounder) {
      // Pour l'instant, seul le fondateur peut accéder aux routes partenaire
      // TODO: Ajouter vérification de la table user_profiles pour les partenaires
      console.log(`[GARDIEN] 🚫 ACCÈS REFUSÉ: ${userEmail} → ${pathname} (PARTNER_ONLY)`);
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  return response;
}

// ============================================================================
// 🔒 FONCTIONS UTILITAIRES - SÉCURITÉ HARD-CODED
// ============================================================================

/**
 * Vérifie si l'email est celui du fondateur
 * C'est LA SEULE vérification qui compte pour les routes admin
 */
function isFounderEmail(email: string): boolean {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedFounder = FOUNDER_EMAIL.toLowerCase().trim();
  return normalizedEmail === normalizedFounder;
}

/**
 * Obtient la route d'accueil selon que l'utilisateur est fondateur ou non
 */
function getHomeRouteForRole(email: string | undefined): string {
  if (email && isFounderEmail(email)) {
    return '/admin';
  }
  // Tous les autres utilisateurs → Dashboard client
  return '/dashboard';
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
