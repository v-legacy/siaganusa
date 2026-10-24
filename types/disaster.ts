/**
 * @file types/disaster.ts
 * @description TypeScript type definitions untuk data titik bencana (hotspot kebakaran)
 * yang bersumber dari API KANARI dan digunakan di seluruh komponen SiagaNusa.
 */

/** Jenis tingkat keyakinan deteksi titik api oleh satelit */
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/** Status aktif/terkini titik api */
export type HotspotStatus = 'ACTIVE' | 'CONTAINED' | 'VERIFIED';

/**
 * Model data utama titik bencana kebakaran hutan/lahan.
 * Merepresentasikan satu titik panas (hotspot) yang terdeteksi oleh satelit.
 */
export interface DisasterHotspot {
  id: string;
  /** Latitude dalam derajat desimal */
  latitude: number;
  /** Longitude dalam derajat desimal */
  longitude: number;
  /** Nama lengkap lokasi terdekat */
  locationName: string;
  /** Nama kecamatan (jika tersedia) */
  district?: string;
  /** Nama kabupaten/kota */
  regency?: string;
  /** Nama provinsi */
  province: string;
  /** Tingkat keyakinan deteksi: HIGH, MEDIUM, atau LOW */
  confidence: ConfidenceLevel;
  /** Nilai persentase keyakinan (0-100, jika tersedia dari API) */
  confidenceValue?: number;
  /** Suhu kecerahan dalam Kelvin (brightness temperature) */
  brightnessTempKelvin?: number;
  /** Nama satelit pendeteksi (contoh: "VIIRS - SNPP", "MODIS - TERRA") */
  satellite: string;
  /** Waktu deteksi dalam format ISO 8601 */
  detectedAt: string;
  /** Status terkini titik api */
  status: HotspotStatus;
  /** Sumber data */
  source: 'KANARI' | 'SIPONGI' | 'MOCK';
  /** Bounding box cluster kebakaran [minLng, minLat, maxLng, maxLat] dari KANARI */
  bbox?: [number, number, number, number];
  /** Jumlah deteksi kumulatif sensor satelit pada cluster ini */
  count?: number;
  /** Daya radiasi api maksimal (Fire Radiative Power dalam MegaWatt / MW) */
  maxFrp?: number;
  /** Waktu deteksi satelit pertama kali */
  firstSeen?: string;
  /** Waktu deteksi satelit terakhir kali */
  lastSeen?: string;
  /** Deteksi sensor VIIRS */
  viirsCount?: number;
  /** Deteksi sensor GOES */
  goesCount?: number;
  /** Deteksi sensor Meteosat MTG */
  mtgCount?: number;
}

/**
 * Statistik ringkasan titik api, untuk ditampilkan di header dan summary card.
 */
export interface HotspotSummary {
  total: number;
  high: number;
  medium: number;
  low: number;
  lastUpdated: string;
}

/**
 * Respons dari internal API route /api/hotspots
 */
export interface HotspotsApiResponse {
  success: boolean;
  data: DisasterHotspot[];
  summary: HotspotSummary;
  source: string;
  fetchedAt: string;
}
