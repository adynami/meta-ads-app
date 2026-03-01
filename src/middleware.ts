import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://graph.facebook.com https://*.fbcdn.net; connect-src 'self' https://graph.facebook.com https://api.stripe.com; frame-src https://js.stripe.com; font-src 'self' data:;",
  );
  return response;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes — no auth required
  const publicRoutes = ['/', '/login', '/register', '/onboarding', '/about', '/docs', '/privacy', '/terms', '/deletion-status', '/api/auth', '/api/billing/webhook', '/api/meta/deletion'];
  if (publicRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Protected routes — redirect to login if not authenticated
  if (!req.auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return withSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
