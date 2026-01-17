import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ============================================================================
// CONFIGURATION SÉCURITÉ - MODÈLE SOLO-FONDATEUR
// ============================================================================

const cookieOptions = {
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7,
};

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_FOUNDER_EMAIL || '';

const PUBLIC_PATHS = ['/', '/login', '/mentions-legales', '/confidentialite', '/landing', '/cgv', '/tarifs', '/403'];

const ADMIN_ROUTES = ['/admin'];

// Routes orphelines à rediriger vers /admin (sécurité stricte)
const ORPHAN_ROUTES = ['/direction', '/partenaire', '/prospection', '/entreprises'];

// ============================================================================
// MIDDLEWARE PRINCIPAL
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

  // Utilisateur connecté sur login → rediriger vers home
  if (user && isLoginPage) {
    const { data: { session } } = await supabase.auth.getSession();
    const homeRoute = isAdminEmail(user.email) ? '/admin' : '/dashboard';
    
    if (session) {
      const redirectResponse = NextResponse.redirect(new URL(homeRoute, request.url));
      redirectResponse.cookies.set('sb-access-token', session.access_token, cookieOptions);
      redirectResponse.cookies.set('sb-refresh-token', session.refresh_token, cookieOptions);
      return redirectResponse;
    }
    return NextResponse.redirect(new URL(homeRoute, request.url));
  }

  // Non connecté sur page protégée → login
  if (!user && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protection des routes admin
  if (user) {
    const userEmail = user.email?.toLowerCase().trim() || '';
    const isAdmin = isAdminEmail(userEmail);
    
    const isAdminRoute = ADMIN_ROUTES.some(
      route => pathname === route || pathname.startsWith(`${route}/`)
    );
    
    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL('/403', request.url));
    }
    
    // Redirection des routes orphelines vers /admin (admin only)
    const isOrphanRoute = ORPHAN_ROUTES.some(
      route => pathname === route || pathname.startsWith(`${route}/`)
    );
    
    if (isOrphanRoute) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/403', request.url));
      }
      // Admin accédant à une route orpheline → rediriger vers /admin
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return response;
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  if (!ADMIN_EMAIL || ADMIN_EMAIL.trim() === '') return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
