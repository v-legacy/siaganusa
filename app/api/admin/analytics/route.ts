import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSummary } from '@/lib/analytics';
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const sessionCheck = verifyAdminSessionToken(sessionCookie);

    // Cek otentikasi
    if (!sessionCheck.valid) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const daysParam = parseInt(searchParams.get('days') || '7', 10);
    const days = isNaN(daysParam) ? 7 : Math.min(Math.max(daysParam, 1), 90);

    const data = await getAnalyticsSummary(days);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat data analytics.' },
      { status: 500 }
    );
  }
}
