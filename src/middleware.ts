import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const cookieOptions = {
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7,
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === '/login';
  
  // Pages publiques (pas besoin d'authentification)
  const publicPaths = ['/', '/login', '/mentions-legales', '/confidentialite', '/landing'];
  const isPublicPage = publicPaths.includes(pathname);
  
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

  // Utilisateur connecté sur la page login → rediriger vers dashboard
  if (user && isLoginPage) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));
      redirectResponse.cookies.set('sb-access-token', session.access_token, cookieOptions);
      redirectResponse.cookies.set('sb-refresh-token', session.refresh_token, cookieOptions);
      return redirectResponse;
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Utilisateur non connecté sur page protégée → rediriger vers login
  if (!user && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
