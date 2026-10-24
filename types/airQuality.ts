/**
 * @file types/airQuality.ts
 * @description Type definitions untuk data kualitas udara, konsentrasi partikulat asap (PM2.5, PM10, CO),
 * dan klasifikasi Indeks Standar Pencemar Udara (ISPU) standar KLHK / WHO via Open-Meteo Air Quality API.
 */

export type IspuCategory =
  | 'BAIK'
  | 'SEDANG'
  | 'TIDAK_SEHAT'
  | 'SANGAT_TIDAK_SEHAT'
  | 'BERBAHAYA';

export interface IspuInfo {
  category: IspuCategory;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  healthRecommendation: string;
  maskRecommendation: string;
  vulnerableGroupGuidance: string;
}

export interface AirQualityData {
  latitude: number;
  longitude: number;
  /** Konsentrasi PM2.5 dalam μg/m³ (Partikel halus asap pembakaran karhutla) */
  pm25: number;
  /** Konsentrasi PM10 dalam μg/m³ (Partikel kasar abu/debu kebakaran) */
  pm10: number;
  /** Konsentrasi Karbon Monoksida dalam μg/m³ */
  carbonMonoxide: number;
  /** US Air Quality Index (0 - 500) */
  usAqi: number;
  /** European Air Quality Index (0 - 100+) */
  europeanAqi: number;
  /** Nilai kalkulasi ISPU Indonesia berdasarkan Permen LHK No. 14 Tahun 2020 */
  ispuValue: number;
  /** Kategori ISPU */
  ispuCategory: IspuCategory;
  /** Detail informasi kategori & rekomendasi mitigasi kesehatan */
  ispuInfo: IspuInfo;
  /** Timestamp waktu pengambilan data */
  lastUpdated: string;
}

export interface AirQualityApiResponse {
  success: boolean;
  data: AirQualityData | null;
  error?: string;
  fetchedAt: string;
}
