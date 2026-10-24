/**
 * @file app/api/hotspots/route.ts
 * @description API Route Handler untuk mengambil data titik api (hotspot) kebakaran
 * real-time dari API resmi KANARI (https://kanari.io/api/events).
 *
 * Mengambil data cluster satelit (VIIRS, GOES, MTG) global dari Kanari,
 * memfilter wilayah teritori Indonesia (lat: -11 s/d 6, lng: 95 s/d 141),
 * dan mengembalikan data lengkap termasuk Bounding Box (sebaran area) serta Fire Radiative Power (MW).
 *
 * Endpoint: GET /api/hotspots
 */

import { NextResponse } from 'next/server';
import type { DisasterHotspot, HotspotsApiResponse } from '@/types/disaster';
import { isInsideIndonesia, resolveIndonesiaRegion } from '@/lib/indonesiaBounds';

// ─── Cache in-memory (5 menit sesuai ketentuan fair-use kanari.io) ─────────────
let cachedData: HotspotsApiResponse | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 menit

/**
 * Mapping confidence dari Kanari
 */
function parseKanariConfidence(confidence?: string, maxConf?: string): DisasterHotspot['confidence'] {
  if (confidence === 'corrobore' || maxConf === 'h') return 'HIGH';
  if (confidence === 'probable' || maxConf === 'n') return 'MEDIUM';
  return 'LOW';
}

/**
 * Mengambil dan memfilter data titik api dari API resmi KANARI
 */
async function fetchFromKanari(): Promise<DisasterHotspot[] | null> {
  try {
    // Kanari events API dalam 24 jam terakhir dengan full dataset
    const response = await fetch('https://kanari.io/api/events?hours=24&full=1', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SiagaNusa-KarhutlaWatch/1.0',
      },
      // Timeout 10 detik
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`[KANARI API] Gagal mengambil data: ${response.status} ${response.statusText}`);
      return null;
    }

    const json = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: any[] = json.events || [];

    // Filter ketat: HANYA titik api yang berada 100% di dalam teritori kedaulatan Indonesia
    // Mengeliminasi total titik api dari Malaysia (Semenanjung, Sarawak, Sabah), Brunei, Singapura, Timor Leste, PNG, dan Filipina
    const indonesiaEvents = events.filter((ev) => {
      const [lng, lat] = ev.centroid || [];
      return (
        typeof lng === 'number' &&
        typeof lat === 'number' &&
        isInsideIndonesia(lat, lng)
      );
    });

    // Urutkan berdasarkan intensitas daya radiasi (maxFrp) dan jumlah deteksi (count)
    indonesiaEvents.sort((a, b) => (b.maxFrp || 0) - (a.maxFrp || 0));

    return indonesiaEvents.map((ev, idx): DisasterHotspot => {
      const [lng, lat] = ev.centroid;
      const { province, locationName } = resolveIndonesiaRegion(lat, lng);
      const confLevel = parseKanariConfidence(ev.confidence, ev.maxConf);
      const confValue = confLevel === 'HIGH' ? 90 : confLevel === 'MEDIUM' ? 70 : 45;

      // Susun nama sensor/satelit
      const sensors: string[] = [];
      if (ev.viirsCount) sensors.push(`VIIRS (${ev.viirsCount})`);
      if (ev.goesCount) sensors.push(`GOES (${ev.goesCount})`);
      if (ev.mtgCount) sensors.push(`Meteosat (${ev.mtgCount})`);
      const satelliteStr = sensors.length > 0 ? sensors.join(', ') : 'Satelit Gabungan';

      return {
        id: ev.id || `kanari-id-${idx}`,
        latitude: lat,
        longitude: lng,
        locationName: ev.social?.place ? `${ev.social.place}, ${province}` : locationName,
        province,
        confidence: confLevel,
        confidenceValue: confValue,
        brightnessTempKelvin: ev.maxFrp ? Math.round(300 + Math.min(ev.maxFrp, 100)) : 330,
        satellite: satelliteStr,
        detectedAt: ev.lastSeen || ev.firstSeen || new Date().toISOString(),
        status: 'ACTIVE',
        source: 'KANARI',
        bbox: ev.bbox,
        count: ev.count || 1,
        maxFrp: ev.maxFrp || 0,
        firstSeen: ev.firstSeen,
        lastSeen: ev.lastSeen,
        viirsCount: ev.viirsCount,
        goesCount: ev.goesCount,
        mtgCount: ev.mtgCount,
      };
    });
  } catch (error) {
    console.error('[KANARI API] Terjadi kesalahan saat fetch:', error);
    return null;
  }
}

// ─── Fallback Mock Data jika Kanari offline ──────────────────────────────────
const FALLBACK_MOCK: DisasterHotspot[] = [
  { id: 'mock-001', latitude: 1.6515, longitude: 101.4415, locationName: 'Dumai, Riau', province: 'Riau', confidence: 'HIGH', confidenceValue: 92, brightnessTempKelvin: 341, satellite: 'VIIRS - SNPP', detectedAt: new Date(Date.now() - 30 * 60000).toISOString(), status: 'ACTIVE', source: 'MOCK', count: 12, maxFrp: 185 },
  { id: 'mock-002', latitude: 0.5071, longitude: 101.4477, locationName: 'Pekanbaru, Riau', province: 'Riau', confidence: 'HIGH', confidenceValue: 88, brightnessTempKelvin: 337, satellite: 'MODIS - TERRA', detectedAt: new Date(Date.now() - 45 * 60000).toISOString(), status: 'ACTIVE', source: 'MOCK', count: 8, maxFrp: 110 },
  { id: 'mock-003', latitude: -1.6814, longitude: 111.5335, locationName: 'Palangka Raya, Kalteng', province: 'Kalimantan Tengah', confidence: 'HIGH', confidenceValue: 95, brightnessTempKelvin: 350, satellite: 'VIIRS - SNPP', detectedAt: new Date(Date.now() - 20 * 60000).toISOString(), status: 'ACTIVE', source: 'MOCK', count: 15, maxFrp: 220 },
  { id: 'mock-004', latitude: -2.9900, longitude: 104.7566, locationName: 'Ogan Ilir, Sumsel', province: 'Sumatera Selatan', confidence: 'HIGH', confidenceValue: 90, brightnessTempKelvin: 344, satellite: 'MODIS - AQUA', detectedAt: new Date(Date.now() - 15 * 60000).toISOString(), status: 'ACTIVE', source: 'MOCK', count: 7, maxFrp: 95 },
  { id: 'mock-005', latitude: -7.7538, longitude: 138.1242, locationName: 'Merauke, Papua Selatan', province: 'Papua Selatan', confidence: 'HIGH', confidenceValue: 94, brightnessTempKelvin: 348, satellite: 'VIIRS - NOAA-20', detectedAt: new Date(Date.now() - 25 * 60000).toISOString(), status: 'ACTIVE', source: 'MOCK', count: 11, maxFrp: 148 },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const now = Date.now();

  // Return dari cache jika masih valid dan tidak dipaksa refresh
  if (!forceRefresh && cachedData && now - cacheTimestamp < CACHE_DURATION_MS) {
    return NextResponse.json(cachedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        'X-Data-Source': `${cachedData.source} (Cache)`,
      },
    });
  }

  // Coba ambil live data dari KANARI
  let hotspots = await fetchFromKanari();
  let source = 'KANARI (Live Real-time Satelit)';

  // Fallback ke mock jika fetch gagal atau kosong
  if (!hotspots || hotspots.length === 0) {
    console.warn('[KANARI API] Menggunakan data fallback mock.');
    hotspots = FALLBACK_MOCK;
    source = 'Mock Data (Fallback)';
  }

  // Hitung ringkasan statistik
  const summary = {
    total: hotspots.length,
    high: hotspots.filter((h) => h.confidence === 'HIGH').length,
    medium: hotspots.filter((h) => h.confidence === 'MEDIUM').length,
    low: hotspots.filter((h) => h.confidence === 'LOW').length,
    lastUpdated: new Date().toISOString(),
  };

  const responsePayload: HotspotsApiResponse = {
    success: true,
    data: hotspots,
    summary,
    source,
    fetchedAt: new Date().toISOString(),
  };

  // Simpan ke cache
  cachedData = responsePayload;
  cacheTimestamp = now;

  return NextResponse.json(responsePayload, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      'X-Data-Source': source,
    },
  });
}
