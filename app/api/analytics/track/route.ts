import { NextRequest, NextResponse } from 'next/server';
import { recordVisit } from '@/lib/analytics';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userAgent = req.headers.get('user-agent') || '';
    const referrerHeader = req.headers.get('referer') || '';

    // Data dari client (path, referrer, utm)
    const clientPath = typeof body.path === 'string' ? body.path : '/';

    // Abaikan tracking path internal admin atau API
    if (clientPath.startsWith('/admin') || clientPath.startsWith('/api')) {
      return NextResponse.json({ success: true, status: 'admin_path_skipped' });
    }

    const clientReferrer = typeof body.referrer === 'string' ? body.referrer : referrerHeader;
    const clientUtm = typeof body.utmSource === 'string' ? body.utmSource : undefined;

    // Resolusi IP Asli (Prioritas: Cloudflare -> Vercel/Nginx -> X-Forwarded-For)
    const cfIp = req.headers.get('cf-connecting-ip');
    const realIp = req.headers.get('x-real-ip');
    const forwardedFor = req.headers.get('x-forwarded-for');

    let rawIp = '127.0.0.1';
    if (cfIp) {
      rawIp = cfIp.trim();
    } else if (realIp) {
      rawIp = realIp.trim();
    } else if (forwardedFor) {
      rawIp = forwardedFor.split(',')[0].trim();
    }

    // Resolusi Geolocation Asli (Cloudflare / Vercel Edge Headers)
    const countryCode =
      req.headers.get('cf-ipcountry') ||
      req.headers.get('x-vercel-ip-country') ||
      undefined;

    const cityName =
      req.headers.get('cf-ipcity') ||
      req.headers.get('x-vercel-ip-city') ||
      undefined;

    const regionName =
      req.headers.get('cf-region') ||
      req.headers.get('x-vercel-ip-country-region') ||
      undefined;

    // Simpan ke Supabase PostgreSQL dengan proteksi anti-overload & session deduplication
    const result = await recordVisit({
      rawIp,
      userAgent,
      clientReferrer,
      utmSource: clientUtm,
      clientPath,
      countryCode,
      cityName,
      regionName,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Error in /api/analytics/track:', err);
    return NextResponse.json({ success: false, status: 'error' }, { status: 500 });
  }
}
