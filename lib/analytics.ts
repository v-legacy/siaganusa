import crypto from 'crypto';
import sql from './db';

export interface TrafficVisit {
  id: string;
  timestamp: string; // ISO string
  ip: string;
  device: 'Mobile' | 'Desktop / Laptop' | 'Tablet';
  deviceModel: string;
  browser: string;
  os: string;
  source: 'Instagram' | 'Twitter / X' | 'TikTok' | 'WhatsApp' | 'Facebook' | 'Google Search' | 'Direct' | 'Lainnya';
  referrerUrl: string;
  country: string;
  countryCode: string;
  city: string;
  path: string;
  hits?: number;
}

export interface AnalyticsSummary {
  totalVisits: number;
  uniqueVisitors: number;
  liveVisitors: number;
  mobilePercentage: number;
  desktopPercentage: number;
  topSocialSource: string;
  topCountry: string;
  timeline: {
    date: string;
    label: string;
    visits: number;
    uniques: number;
  }[];
  sources: {
    source: string;
    count: number;
    percentage: number;
    color: string;
    icon: string;
  }[];
  devices: {
    device: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  countries: {
    country: string;
    code: string;
    flag: string;
    count: number;
    percentage: number;
  }[];
  recentVisits: TrafficVisit[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ANTI-OVERLOAD & THROTTLING (In-Memory Protection Layer)
// Sesuai standar industri: Plausible / Umami / Cloudflare Web Analytics
// ─────────────────────────────────────────────────────────────────────────────

interface ThrottleRecord {
  lastSeen: number;
  count: number;
}

// Menyimpan cache IP + path dalam memori server untuk debounce & rate-limiting
const inMemoryThrottle = new Map<string, ThrottleRecord>();

// Bersihkan cache memori setiap 5 menit agar tidak memakan RAM
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of inMemoryThrottle.entries()) {
      if (now - record.lastSeen > 5 * 60 * 1000) {
        inMemoryThrottle.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

const BOT_PATTERNS = [
  'bot', 'crawler', 'spider', 'slurp', 'mediapartners', 'googlebot',
  'bingbot', 'yandex', 'duckduckbot', 'baiduspider', 'ahrefs', 'semrush',
  'dotbot', 'mj12bot', 'curl', 'wget', 'python', 'postman', 'headless',
  'lighthouse', 'uptimerobot', 'node-fetch', 'axios', 'go-http-client'
];

export function isBotUserAgent(ua: string): boolean {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return BOT_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function maskIp(ip: string): string {
  if (!ip) return '127.0.0.***';
  // IPv4: mask oktet terakhir
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
    }
  }
  // IPv6: mask segmen terakhir
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, 3).join(':')}::***`;
  }
  return ip;
}

export function generateVisitorHash(rawIp: string, userAgent: string): string {
  const salt = process.env.ANALYTICS_SALT || 'siaganusa_salt_2026';
  return crypto
    .createHash('sha256')
    .update(`${rawIp}|${userAgent}|${salt}`)
    .digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// RECORD VISIT (SUPABASE + ANTI OVERLOAD & DE-DUPLICATION)
// ─────────────────────────────────────────────────────────────────────────────

export interface RecordVisitInput {
  rawIp: string;
  userAgent: string;
  clientReferrer?: string;
  utmSource?: string;
  clientPath?: string;
  countryCode?: string;
  countryName?: string;
  cityName?: string;
  regionName?: string;
}

export async function recordVisit(input: RecordVisitInput): Promise<{
  success: boolean;
  status: 'recorded' | 'debounced' | 'rate_limited' | 'bot_skipped' | 'db_error';
  visitId?: string;
}> {
  const {
    rawIp,
    userAgent,
    clientReferrer = '',
    utmSource,
    clientPath = '/',
  } = input;

  // 1. Filter Bot / Crawler (Jangan membebani database dengan bot search engine)
  if (isBotUserAgent(userAgent)) {
    return { success: true, status: 'bot_skipped' };
  }

  // 2. In-Memory Throttling & Debounce
  // Jika IP yang sama mengirim request pada path yang sama dalam waktu < 15 detik, abaikan penulisan DB
  const now = Date.now();
  const throttleKey = `${rawIp}:${clientPath}`;
  const existing = inMemoryThrottle.get(throttleKey);

  if (existing) {
    // Rate limit: lebih dari 30 request/menit dari IP yang sama
    if (now - existing.lastSeen < 60_000 && existing.count >= 30) {
      return { success: true, status: 'rate_limited' };
    }

    // Debounce: jika request masuk < 15 detik dari hit sebelumnya pada path yang sama
    if (now - existing.lastSeen < 15_000) {
      existing.lastSeen = now;
      existing.count += 1;
      return { success: true, status: 'debounced' };
    }

    existing.lastSeen = now;
    existing.count += 1;
  } else {
    inMemoryThrottle.set(throttleKey, { lastSeen: now, count: 1 });
  }

  // 3. Ekstrak data perangkat, OS, browser, dan sumber
  const { device, deviceModel, os, browser } = parseUserAgent(userAgent);
  const source = parseReferrer(clientReferrer, utmSource);
  const ipMasked = maskIp(rawIp);
  const visitorHash = generateVisitorHash(rawIp, userAgent);

  // 4. Session bucket standar industri (30 Menit window)
  // Window 30 menit memastikan kunjungan dari orang yang sama tidak menduplikasi baris database
  const sessionBucket = Math.floor(now / (30 * 60 * 1000));

  // 5. Resolusi Referrer Host
  let referrerHost = 'Direct';
  try {
    if (clientReferrer && clientReferrer.startsWith('http')) {
      referrerHost = new URL(clientReferrer).hostname;
    }
  } catch {
    referrerHost = 'Direct';
  }

  // 6. Resolusi Lokasi (Menggunakan header Cloudflare / Vercel atau fallback)
  let countryCode = input.countryCode || 'ID';
  let country = input.countryName || 'Indonesia';
  let city = input.cityName || (countryCode === 'ID' ? 'Jakarta, DKI' : country);
  const region = input.regionName || (countryCode === 'ID' ? 'DKI Jakarta' : country);

  // Jika IP lokal / loopback development
  if (rawIp === '127.0.0.1' || rawIp === '::1' || rawIp.startsWith('192.168.') || rawIp.startsWith('10.')) {
    countryCode = 'ID';
    country = 'Indonesia';
    city = 'Lokal (Dev)';
  } else if (!input.countryCode && countryCode === 'ID' && !input.cityName) {
    city = 'Indonesia';
  }

  // 7. Simpan ke Supabase PostgreSQL dengan UPSERT (ON CONFLICT DO UPDATE)
  // Ini mencegah tumpang tindih data:
  // - Kunjungan pertama dalam 30 menit -> INSERT baris baru (hits = 1)
  // - Kunjungan berulang dalam 30 menit -> UPDATE hits = hits + 1 & last_seen_at = NOW()
  try {
    const result = await sql`
      INSERT INTO analytics_visits (
        session_bucket,
        visitor_hash,
        ip_masked,
        device,
        device_model,
        os,
        browser,
        source,
        referrer_host,
        referrer_url,
        country_code,
        country,
        region,
        city,
        path,
        hits
      ) VALUES (
        ${sessionBucket},
        ${visitorHash},
        ${ipMasked},
        ${device},
        ${deviceModel},
        ${os},
        ${browser},
        ${source},
        ${referrerHost},
        ${clientReferrer ? clientReferrer.slice(0, 500) : 'Direct Visit'},
        ${countryCode},
        ${country},
        ${region},
        ${city},
        ${clientPath.slice(0, 255)},
        1
      )
      ON CONFLICT (visitor_hash, session_bucket)
      DO UPDATE SET
        hits = analytics_visits.hits + 1,
        last_seen_at = NOW(),
        path = EXCLUDED.path
      RETURNING id::text;
    `;

    const visitId = result[0]?.id;
    return { success: true, status: 'recorded', visitId };
  } catch (err) {
    console.error('Error saving analytics visit to Supabase:', err);
    return { success: false, status: 'db_error' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERY ANALYTICS SUMMARY DARI SUPABASE
// ─────────────────────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
  'Instagram': '#E1306C',
  'Twitter / X': '#1DA1F2',
  'TikTok': '#00F2FE',
  'WhatsApp': '#25D366',
  'Facebook': '#1877F2',
  'Google Search': '#4285F4',
  'Direct': '#64748B',
  'Lainnya': '#8B5CF6',
};

const COUNTRY_FLAGS: Record<string, string> = {
  'Indonesia': '🇮🇩',
  'Malaysia': '🇲🇾',
  'Singapore': '🇸🇬',
  'United States': '🇺🇸',
  'Australia': '🇦🇺',
  'Japan': '🇯🇵',
  'Thailand': '🇹🇭',
  'United Kingdom': '🇬🇧',
  'Netherlands': '🇳🇱',
  'Germany': '🇩🇪',
};

export async function getAnalyticsSummary(timeRangeDays: number = 7): Promise<AnalyticsSummary> {
  const days = Math.min(Math.max(timeRangeDays, 1), 90);

  try {
    // 1. Total Kunjungan (SUM hits) & Pengunjung Unik (COUNT DISTINCT visitor_hash)
    const [totals] = await sql`
      SELECT
        COALESCE(SUM(hits), 0)::bigint AS total_visits,
        COUNT(DISTINCT visitor_hash)::bigint AS unique_visitors
      FROM analytics_visits
      WHERE created_at >= NOW() - (${days} || ' days')::interval
    `;

    const totalVisits = Number(totals?.total_visits || 0);
    const uniqueVisitors = Number(totals?.unique_visitors || 0);

    // 2. Pengunjung Aktif Real-Time (Last seen dalam 5 menit terakhir)
    const [live] = await sql`
      SELECT COUNT(DISTINCT visitor_hash)::bigint AS live_visitors
      FROM analytics_visits
      WHERE last_seen_at >= NOW() - INTERVAL '5 minutes'
    `;
    const liveVisitors = Number(live?.live_visitors || 0);

    // 3. Sumber Trafik (Media Sosial & Referral)
    const sourceRows = await sql`
      SELECT
        source,
        COALESCE(SUM(hits), 0)::bigint AS count
      FROM analytics_visits
      WHERE created_at >= NOW() - (${days} || ' days')::interval
      GROUP BY source
      ORDER BY count DESC
      LIMIT 10
    `;

    const sources = sourceRows.map((r: Record<string, unknown>) => {
      const sourceName = String(r.source || 'Direct');
      const count = Number(r.count || 0);
      return {
        source: sourceName,
        count,
        percentage: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
        color: SOURCE_COLORS[sourceName] || '#94A3B8',
        icon: sourceName,
      };
    });

    const topSocialSource =
      sources.find((s) => s.source !== 'Direct')?.source ||
      sources[0]?.source ||
      '-';

    // 4. Distribusi Perangkat (Mobile vs Desktop vs Tablet)
    const deviceRows = await sql`
      SELECT
        device,
        COALESCE(SUM(hits), 0)::bigint AS count
      FROM analytics_visits
      WHERE created_at >= NOW() - (${days} || ' days')::interval
      GROUP BY device
      ORDER BY count DESC
    `;

    const deviceMap: Record<string, number> = {
      'Mobile': 0,
      'Desktop / Laptop': 0,
      'Tablet': 0,
    };
    deviceRows.forEach((r: Record<string, unknown>) => {
      const devName = String(r.device || '');
      if (devName in deviceMap) {
        deviceMap[devName] = Number(r.count || 0);
      }
    });

    const devices = [
      {
        device: 'Mobile (HP)',
        count: deviceMap['Mobile'],
        percentage: totalVisits > 0 ? Math.round((deviceMap['Mobile'] / totalVisits) * 100) : 0,
        color: '#3B82F6',
      },
      {
        device: 'Desktop / Laptop',
        count: deviceMap['Desktop / Laptop'],
        percentage: totalVisits > 0 ? Math.round((deviceMap['Desktop / Laptop'] / totalVisits) * 100) : 0,
        color: '#10B981',
      },
      {
        device: 'Tablet',
        count: deviceMap['Tablet'],
        percentage: totalVisits > 0 ? Math.round((deviceMap['Tablet'] / totalVisits) * 100) : 0,
        color: '#F59E0B',
      },
    ];

    const mobilePercentage = devices[0].percentage;
    const desktopPercentage = devices[1].percentage;

    // 5. Asal Negara & Wilayah
    const countryRows = await sql`
      SELECT
        country,
        country_code,
        COALESCE(SUM(hits), 0)::bigint AS count
      FROM analytics_visits
      WHERE created_at >= NOW() - (${days} || ' days')::interval
      GROUP BY country, country_code
      ORDER BY count DESC
      LIMIT 10
    `;

    const countries = countryRows.map((r: Record<string, unknown>) => {
      const countryName = String(r.country || 'Indonesia');
      const count = Number(r.count || 0);
      return {
        country: countryName,
        code: String(r.country_code || 'ID'),
        flag: COUNTRY_FLAGS[countryName] || '🌐',
        count,
        percentage: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
      };
    });

    const topCountry = countries[0]?.country || '-';

    // 6. Grafik Tren Waktu (Continuous Timeline)
    let timeline: AnalyticsSummary['timeline'] = [];

    if (days === 1) {
      // 24 Jam terakhir (per jam)
      const hourlyRows = await sql`
        WITH hours AS (
          SELECT generate_series(
            date_trunc('hour', NOW() - INTERVAL '23 hours'),
            date_trunc('hour', NOW()),
            INTERVAL '1 hour'
          ) AS hr
        )
        SELECT
          to_char(h.hr, 'YYYY-MM-DD"T"HH24:00:00') AS date,
          to_char(h.hr, 'HH24:00') AS label,
          COALESCE(SUM(v.hits), 0)::int AS visits,
          COUNT(DISTINCT v.visitor_hash)::int AS uniques
        FROM hours h
        LEFT JOIN analytics_visits v
          ON date_trunc('hour', v.created_at) = h.hr
        GROUP BY h.hr
        ORDER BY h.hr ASC
      `;

      timeline = hourlyRows.map((r: Record<string, unknown>) => ({
        date: String(r.date || ''),
        label: String(r.label || ''),
        visits: Number(r.visits || 0),
        uniques: Number(r.uniques || 0),
      }));
    } else {
      // 7 atau 30 hari (per hari)
      const intervalDays = days - 1;
      const dailyRows = await sql`
        WITH days_series AS (
          SELECT generate_series(
            date_trunc('day', NOW() - (${intervalDays} || ' days')::interval),
            date_trunc('day', NOW()),
            INTERVAL '1 day'
          ) AS day
        )
        SELECT
          to_char(d.day, 'YYYY-MM-DD') AS date,
          to_char(d.day, 'Dy, DD Mon') AS label,
          COALESCE(SUM(v.hits), 0)::int AS visits,
          COUNT(DISTINCT v.visitor_hash)::int AS uniques
        FROM days_series d
        LEFT JOIN analytics_visits v
          ON date_trunc('day', v.created_at) = d.day
        GROUP BY d.day
        ORDER BY d.day ASC
      `;

      timeline = dailyRows.map((r: Record<string, unknown>) => ({
        date: String(r.date || ''),
        label: String(r.label || ''),
        visits: Number(r.visits || 0),
        uniques: Number(r.uniques || 0),
      }));
    }

    // 7. Log Kunjungan Terbaru (50 Transaksi Terakhir)
    const recentRows = await sql`
      SELECT
        id::text,
        created_at,
        last_seen_at,
        ip_masked,
        device,
        device_model,
        browser,
        os,
        source,
        referrer_url,
        country,
        country_code,
        city,
        path,
        hits
      FROM analytics_visits
      ORDER BY last_seen_at DESC
      LIMIT 50
    `;

    const recentVisits: TrafficVisit[] = recentRows.map((r: Record<string, unknown>) => ({
      id: String(r.id || ''),
      timestamp: new Date(String(r.created_at || new Date())).toISOString(),
      ip: String(r.ip_masked || '127.0.0.***'),
      device: (r.device as TrafficVisit['device']) || 'Desktop / Laptop',
      deviceModel: String(r.device_model || 'Perangkat'),
      browser: String(r.browser || 'Browser'),
      os: String(r.os || 'OS'),
      source: (r.source as TrafficVisit['source']) || 'Direct',
      referrerUrl: String(r.referrer_url || 'Direct Visit'),
      country: String(r.country || 'Indonesia'),
      countryCode: String(r.country_code || 'ID'),
      city: String(r.city || 'Indonesia'),
      path: String(r.path || '/'),
      hits: Number(r.hits || 1),
    }));

    return {
      totalVisits,
      uniqueVisitors,
      liveVisitors,
      mobilePercentage,
      desktopPercentage,
      topSocialSource,
      topCountry,
      timeline,
      sources,
      devices,
      countries,
      recentVisits,
    };
  } catch (err) {
    console.error('Error querying analytics summary from Supabase:', err);
    return {
      totalVisits: 0,
      uniqueVisitors: 0,
      liveVisitors: 0,
      mobilePercentage: 0,
      desktopPercentage: 0,
      topSocialSource: '-',
      topCountry: '-',
      timeline: [],
      sources: [],
      devices: [],
      countries: [],
      recentVisits: [],
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// USER AGENT & REFERRER PARSERS
// ─────────────────────────────────────────────────────────────────────────────

export function parseUserAgent(ua: string): {
  device: TrafficVisit['device'];
  deviceModel: string;
  os: string;
  browser: string;
} {
  const uaLower = (ua || '').toLowerCase();

  // 1. Deteksi Perangkat
  let device: TrafficVisit['device'] = 'Desktop / Laptop';
  let deviceModel = 'PC / Laptop';

  if (/ipad|tablet|(android(?!.*mobile))/i.test(uaLower)) {
    device = 'Tablet';
    deviceModel = uaLower.includes('ipad') ? 'iPad' : 'Android Tablet';
  } else if (/mobile|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile/i.test(uaLower)) {
    device = 'Mobile';
    if (uaLower.includes('iphone')) {
      if (uaLower.includes('iphone16') || uaLower.includes('iphone 16')) deviceModel = 'iPhone 16';
      else if (uaLower.includes('iphone15') || uaLower.includes('iphone 15')) deviceModel = 'iPhone 15';
      else if (uaLower.includes('iphone14') || uaLower.includes('iphone 14')) deviceModel = 'iPhone 14';
      else deviceModel = 'iPhone';
    } else if (uaLower.includes('samsung') || uaLower.includes('sm-')) {
      deviceModel = 'Samsung Galaxy';
    } else if (uaLower.includes('xiaomi') || uaLower.includes('redmi') || uaLower.includes('poco')) {
      deviceModel = 'Xiaomi / Redmi';
    } else if (uaLower.includes('oppo') || uaLower.includes('cph')) {
      deviceModel = 'Oppo';
    } else if (uaLower.includes('vivo') || uaLower.includes('v2')) {
      deviceModel = 'Vivo';
    } else if (uaLower.includes('pixel')) {
      deviceModel = 'Google Pixel';
    } else {
      deviceModel = 'Smartphone';
    }
  } else {
    if (uaLower.includes('macintosh') || uaLower.includes('mac os')) {
      deviceModel = 'Mac / MacBook';
    } else if (uaLower.includes('windows')) {
      deviceModel = 'Windows PC';
    } else if (uaLower.includes('linux')) {
      deviceModel = 'Linux Desktop';
    }
  }

  // 2. Deteksi OS
  let os = 'Unknown OS';
  if (uaLower.includes('windows nt 10.0')) os = 'Windows 10/11';
  else if (uaLower.includes('windows')) os = 'Windows';
  else if (uaLower.includes('mac os x')) {
    const match = uaLower.match(/mac os x ([\d_]+)/);
    os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (uaLower.includes('android')) {
    const match = uaLower.match(/android ([\d.]+)/);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (uaLower.includes('iphone os') || uaLower.includes('ios')) {
    const match = uaLower.match(/os ([\d_]+)/);
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
  } else if (uaLower.includes('linux')) {
    os = 'Linux';
  }

  // 3. Deteksi Browser
  let browser = 'Unknown Browser';
  if (uaLower.includes('instagram')) browser = 'Instagram In-App';
  else if (uaLower.includes('tiktok')) browser = 'TikTok In-App';
  else if (uaLower.includes('fbav') || uaLower.includes('fban') || uaLower.includes('facebook')) browser = 'Facebook In-App';
  else if (uaLower.includes('edg/')) browser = 'Microsoft Edge';
  else if (uaLower.includes('chrome/') && !uaLower.includes('edg/')) browser = 'Chrome';
  else if (uaLower.includes('safari/') && !uaLower.includes('chrome')) browser = 'Safari';
  else if (uaLower.includes('firefox/')) browser = 'Firefox';
  else if (uaLower.includes('opera') || uaLower.includes('opr/')) browser = 'Opera';

  return { device, deviceModel, os, browser };
}

export function parseReferrer(
  referrer: string,
  utmSource?: string
): TrafficVisit['source'] {
  const ref = (referrer || '').toLowerCase();
  const utm = (utmSource || '').toLowerCase();

  if (utm === 'instagram' || ref.includes('instagram.com') || ref.includes('ig.me')) {
    return 'Instagram';
  }
  if (utm === 'twitter' || utm === 'x' || ref.includes('t.co') || ref.includes('twitter.com') || ref.includes('x.com')) {
    return 'Twitter / X';
  }
  if (utm === 'tiktok' || ref.includes('tiktok.com')) {
    return 'TikTok';
  }
  if (utm === 'whatsapp' || ref.includes('whatsapp') || ref.includes('wa.me')) {
    return 'WhatsApp';
  }
  if (utm === 'facebook' || ref.includes('facebook.com') || ref.includes('fb.me') || ref.includes('fb.com')) {
    return 'Facebook';
  }
  if (utm === 'google' || ref.includes('google.com') || ref.includes('google.co.id')) {
    return 'Google Search';
  }
  if (!ref || ref.includes('localhost') || ref.includes('siaganusa')) {
    return 'Direct';
  }
  return 'Lainnya';
}
