import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/auth-session';

/**
 * Next.js Proxy (sebelumnya Middleware)
 * Berjalan di sisi server SEBELUM halaman di-render.
 * Mencegah kebocoran (leak) tampilan dashboard admin sebelum user login.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hanya proses rute admin
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = verifyAdminSessionToken(sessionCookie);

    // 1. Jika mencoba akses /admin (bukan halaman login) dan BELUM login:
    // Langsung alihkan (redirect 307) ke /admin/login di server level.
    // Dashboard HTML sama sekali tidak akan pernah dikirim ke browser!
    if (!isLoginPage && !session.valid) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Jika SUDAH login tapi membuka halaman /admin/login:
    // Langsung arahkan ke dashboard /admin
    if (isLoginPage && session.valid) {
      const adminUrl = new URL('/admin', request.url);
      return NextResponse.redirect(adminUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
