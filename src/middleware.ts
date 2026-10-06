import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://graph.facebook.com https://*.fbcdn.net https://www.googletagmanager.com; connect-src 'self' https://vercel.com https://*.blob.vercel-storage.com https://graph.facebook.com https://api.stripe.com https://www.google-analytics.com https://google-analytics.com https://www.googletagmanager.com https://googletagmanager.com; frame-src https://js.stripe.com; font-src 'self' data:;",
  );
  return response;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const BYPASS_SECRET = process.env.LAUNCH_BYPASS_SECRET;

  // Set bypass cookie via query param
  if (BYPASS_SECRET && pathname === '/early-access') {
    const bypassParam = req.nextUrl.searchParams.get('bypass');
    if (bypassParam === BYPASS_SECRET) {
      const response = NextResponse.redirect(new URL('/', req.url));
      response.cookies.set('launch_bypass', BYPASS_SECRET, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return withSecurityHeaders(response);
    }
  }

  // If bypass cookie is valid, use normal site behavior
  if (BYPASS_SECRET && req.cookies.get('launch_bypass')?.value === BYPASS_SECRET) {
    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/onboarding',
      '/about',
      '/docs',
      '/early-access',
      '/privacy',
      '/terms',
      '/deletion-status',
      '/api/auth',
      '/api/billing/webhook',
      '/api/meta/deletion',
      '/api/cron', // authenticated by CRON_SECRET
    ];
    if (publicRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
      return withSecurityHeaders(NextResponse.next());
    }
    if (!req.auth) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  // Launch mode — only early-access and essential routes are public
  const allowedRoutes = [
    '/early-access',
    '/api/waitlist',
    '/api/auth',
    '/api/billing/webhook',
    '/api/meta/deletion',
    '/api/cron', // authenticated by CRON_SECRET
    '/privacy',
    '/terms',
  ];
  if (allowedRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Everything else redirects to early-access
  return withSecurityHeaders(NextResponse.redirect(new URL('/early-access', req.url)));
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
