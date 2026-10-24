/**
 * @file types/weather.ts
 * @description TypeScript type definitions untuk data cuaca dan arah angin
 * dari Open-Meteo API yang digunakan di komponen WeatherWidget SiagaNusa.
 */

/** Arah mata angin dalam 8 penjuru */
export type WindDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

/**
 * Model data cuaca untuk lokasi tertentu, diambil dari Open-Meteo API.
 */
export interface LocationWeather {
  latitude: number;
  longitude: number;
  /** Suhu udara dalam derajat Celsius */
  temperatureCelsius: number;
  /** Kelembapan udara relatif dalam persen (0-100) */
  relativeHumidity: number;
  /** Kecepatan angin dalam km/jam */
  windSpeedKmh: number;
  /** Arah angin dalam derajat (0-360, 0 = Utara, 90 = Timur) */
  windDirectionDegree: number;
  /** Arah angin dalam notasi mata angin */
  windDirectionCardinal: WindDirection;
  /** Deskripsi kondisi cuaca */
  weatherDescription: string;
  /** Kode cuaca standar WMO */
  weatherCode: number;
  /** Probabilitas hujan dalam persen (0-100) */
  precipitationProbability: number;
  /** Timestamp terakhir pembaruan data */
  lastUpdated: string;
}

/**
 * Respons dari internal API route /api/weather
 */
export interface WeatherApiResponse {
  success: boolean;
  data: LocationWeather | null;
  fetchedAt: string;
}

/**
 * Data zona cuaca regional untuk pemetaan pola arah angin se-Indonesia
 */
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

export interface RegionalWeatherResponse {
  success: boolean;
  data: RegionalZone[];
  source?: 'live' | 'cache' | 'fallback';
  fetchedAt: string;
}

