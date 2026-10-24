/**
 * @file app/api/weather/route.ts
 * @description API Route Handler untuk mengambil data cuaca dan arah/kecepatan angin real-time
 * dari Open-Meteo API (https://open-meteo.com) tanpa memerlukan API key.
 * Digunakan untuk memprediksi arah penyebaran api dan kabut asap karhutla.
 *
 * Endpoint: GET /api/weather?lat=-6.70&lng=107.35
 */

import { NextRequest, NextResponse } from 'next/server';
import type { LocationWeather, WeatherApiResponse, WindDirection } from '@/types/weather';
import { isInsideIndonesia } from '@/lib/indonesiaBounds';

/**
 * Konversi derajat sudut angin (0-360) ke 8 arah mata angin (kardinal)
 */
function degreeToCardinal(deg: number): WindDirection {
  const normalized = (deg % 360 + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'N';
  if (normalized >= 22.5 && normalized < 67.5) return 'NE';
  if (normalized >= 67.5 && normalized < 112.5) return 'E';
  if (normalized >= 112.5 && normalized < 157.5) return 'SE';
  if (normalized >= 157.5 && normalized < 202.5) return 'S';
  if (normalized >= 202.5 && normalized < 247.5) return 'SW';
  if (normalized >= 247.5 && normalized < 292.5) return 'W';
  return 'NW';
}

/**
 * Deskripsi kode cuaca standar WMO
 */
function wmoToDescription(code: number): string {
  if (code === 0) return 'Cerah Berawan';
  if (code === 1 || code === 2) return 'Sebagian Berawan';
  if (code === 3) return 'Mendung Tebal';
  if (code >= 45 && code <= 48) return 'Berkabut / Berasap';
  if (code >= 51 && code <= 55) return 'Gerimis';
  if (code >= 61 && code <= 65) return 'Hujan Ringan - Sedang';
  if (code >= 80 && code <= 82) return 'Hujan Deras';
  if (code >= 95) return 'Hujan Petir';
  return 'Cerah';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');

  if (!latStr || !lngStr) {
    return NextResponse.json(
      { success: false, data: null, error: 'Parameter lat dan lng wajib diisi' },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { success: false, data: null, error: 'Koordinat tidak valid' },
      { status: 400 }
    );
  }

  // Validasi batas wilayah regional Indonesia
  if (!isInsideIndonesia(lat, lng)) {
    return NextResponse.json(
      { success: false, data: null, error: 'Koordinat berada di luar wilayah teritori kedaulatan Indonesia' },
      { status: 400 }
    );
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,precipitation&timezone=auto`;

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SiagaNusa-Weather/1.0',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo status ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;

    const windDeg = current.wind_direction_10m ?? 0;
    const weatherCode = current.weather_code ?? 0;

    const weather: LocationWeather = {
      latitude: lat,
      longitude: lng,
      temperatureCelsius: Math.round((current.temperature_2m ?? 30) * 10) / 10,
      relativeHumidity: Math.round(current.relative_humidity_2m ?? 50),
      windSpeedKmh: Math.round((current.wind_speed_10m ?? 10) * 10) / 10,
      windDirectionDegree: windDeg,
      windDirectionCardinal: degreeToCardinal(windDeg),
      weatherDescription: wmoToDescription(weatherCode),
      weatherCode,
      precipitationProbability: current.precipitation ? Math.min(Math.round(current.precipitation * 10), 100) : 0,
      lastUpdated: new Date().toISOString(),
    };

    const responsePayload: WeatherApiResponse = {
      success: true,
      data: weather,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120',
      },
    });
  } catch (err) {
    console.error('[Open-Meteo] Gagal mengambil data cuaca:', err);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Gagal menghubungi server Open-Meteo',
        fetchedAt: new Date().toISOString(),
      },
      { status: 502 }
    );
  }
}
