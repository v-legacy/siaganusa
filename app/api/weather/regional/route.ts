/**
 * @file app/api/weather/regional/route.ts
 * @description API Route Handler untuk mengambil data cuaca & pola arah angin regional
 * untuk seluruh wilayah kepulauan Indonesia secara serentak (batch query Open-Meteo) tanpa API key.
 *
 * Mengelompokkan Indonesia ke dalam 14 zona klimatologi representatif sehingga setiap titik
 * karhutla di Sumatera, Kalimantan, Jawa, Sulawesi, Nusa Tenggara, Maluku, dan Papua memiliki
 * data arah & kecepatan angin yang akurat dan dinamis.
 */

import { NextResponse } from 'next/server';
import type { WindDirection } from '@/types/weather';

export interface RegionalZone {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  windSpeedKmh: number;
  windDirectionDegree: number;
  windDirectionCardinal: WindDirection;
  temperatureCelsius: number;
  relativeHumidity: number;
}

// ─── 14 Titik Geografis Representatif Zona Indonesia ─────────────────────────
const REGIONAL_ZONES: Array<{ id: string; name: string; region: string; lat: number; lng: number }> = [
  { id: 'sumut-aceh', name: 'Sumatera Bagian Utara', region: 'Sumatera', lat: 3.5, lng: 98.0 },
  { id: 'riau-sumbar', name: 'Riau & Sumatera Barat', region: 'Sumatera', lat: 0.5, lng: 101.5 },
  { id: 'jambi-sumsel', name: 'Jambi & Sumatera Selatan', region: 'Sumatera', lat: -2.5, lng: 104.0 },
  { id: 'lampung-bengkulu', name: 'Lampung & Bengkulu', region: 'Sumatera', lat: -5.0, lng: 105.0 },
  { id: 'kalbar', name: 'Kalimantan Barat', region: 'Kalimantan', lat: 0.0, lng: 110.5 },
  { id: 'kalteng', name: 'Kalimantan Tengah', region: 'Kalimantan', lat: -1.8, lng: 113.8 },
  { id: 'kalsel', name: 'Kalimantan Selatan', region: 'Kalimantan', lat: -3.2, lng: 115.5 },
  { id: 'kaltim-kaltara', name: 'Kalimantan Timur & Kaltara', region: 'Kalimantan', lat: 1.5, lng: 116.8 },
  { id: 'jawa-barat', name: 'DKI Jakarta & Jawa Barat', region: 'Jawa', lat: -6.8, lng: 107.0 },
  { id: 'jawa-tengah-timur', name: 'Jawa Tengah & Jawa Timur', region: 'Jawa', lat: -7.5, lng: 111.5 },
  { id: 'bali-nusra', name: 'Bali & Nusa Tenggara', region: 'Nusa Tenggara', lat: -8.5, lng: 119.5 },
  { id: 'sulsel-sulbar', name: 'Sulawesi Selatan & Barat', region: 'Sulawesi', lat: -4.5, lng: 119.8 },
  { id: 'sulteng-sulut', name: 'Sulawesi Tengah & Utara', region: 'Sulawesi', lat: 0.8, lng: 122.5 },
  { id: 'maluku', name: 'Kepulauan Maluku', region: 'Maluku', lat: -3.0, lng: 128.5 },
  { id: 'papua', name: 'Papua & Papua Barat', region: 'Papua', lat: -3.5, lng: 137.0 },
];

function degreeToCardinal(deg: number): WindDirection {
  const normalized = ((deg % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'N';
  if (normalized >= 22.5 && normalized < 67.5) return 'NE';
  if (normalized >= 67.5 && normalized < 112.5) return 'E';
  if (normalized >= 112.5 && normalized < 157.5) return 'SE';
  if (normalized >= 157.5 && normalized < 202.5) return 'S';
  if (normalized >= 202.5 && normalized < 247.5) return 'SW';
  if (normalized >= 247.5 && normalized < 292.5) return 'W';
  return 'NW';
}

// In-memory cache selama 10 menit
let cachedRegionalData: RegionalZone[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION_MS = 10 * 60 * 1000;

export async function GET() {
  const now = Date.now();

  if (cachedRegionalData && now - lastCacheTime < CACHE_DURATION_MS) {
    return NextResponse.json({
      success: true,
      data: cachedRegionalData,
      source: 'cache',
      fetchedAt: new Date(lastCacheTime).toISOString(),
    });
  }

  try {
    const latList = REGIONAL_ZONES.map((z) => z.lat).join(',');
    const lngList = REGIONAL_ZONES.map((z) => z.lng).join(',');

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latList}&longitude=${lngList}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m`;

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SiagaNusa-RegionalWeather/1.0',
      },
      signal: AbortSignal.timeout(7000),
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo multi-forecast status ${res.status}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any = await res.json();
    const resultArray = Array.isArray(results) ? results : [results];

    const mappedZones: RegionalZone[] = REGIONAL_ZONES.map((zone, index) => {
      const weatherData = resultArray[index]?.current || {};
      const windDeg = weatherData.wind_direction_10m ?? 90;
      const windSpeed = weatherData.wind_speed_10m ?? 12;

      return {
        id: zone.id,
        name: zone.name,
        region: zone.region,
        lat: zone.lat,
        lng: zone.lng,
        windSpeedKmh: Math.round(windSpeed * 10) / 10,
        windDirectionDegree: windDeg,
        windDirectionCardinal: degreeToCardinal(windDeg),
        temperatureCelsius: Math.round((weatherData.temperature_2m ?? 30) * 10) / 10,
        relativeHumidity: Math.round(weatherData.relative_humidity_2m ?? 65),
      };
    });

    cachedRegionalData = mappedZones;
    lastCacheTime = now;

    return NextResponse.json({
      success: true,
      data: mappedZones,
      source: 'live',
      fetchedAt: new Date(now).toISOString(),
    });
  } catch (err) {
    console.error('[Open-Meteo Regional] Gagal mengambil data regional:', err);

    // Fallback data pola musiman Indonesia (Monsun Asia/Australia) jika jaringan eksternal terkendala
    const fallbackZones: RegionalZone[] = REGIONAL_ZONES.map((zone) => ({
      ...zone,
      windSpeedKmh: 12.5,
      windDirectionDegree: 110,
      windDirectionCardinal: 'ESE' as WindDirection,
      temperatureCelsius: 31.0,
      relativeHumidity: 68,
    }));

    return NextResponse.json({
      success: true,
      data: cachedRegionalData || fallbackZones,
      source: 'fallback',
      fetchedAt: new Date(now).toISOString(),
    });
  }
}
