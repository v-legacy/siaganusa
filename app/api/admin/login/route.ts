import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminCredentials,
  createAdminSessionToken,
  ADMIN_COOKIE_NAME,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username, password } = body;

    const authResult = await verifyAdminCredentials(username, password);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, message: authResult.message || 'Username atau password tidak valid!' },
        { status: 401 }
      );
    }

    const sessionToken = createAdminSessionToken(authResult.user);

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: {
        id: authResult.user.id,
        username: authResult.user.username,
        name: authResult.user.name,
        role: authResult.user.role,
      },
    });

    // Set cookie session (7 hari)
    response.cookies.set(ADMIN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 hari
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error saat login admin:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server saat memproses login.' },
      { status: 500 }
    );
  }
}
