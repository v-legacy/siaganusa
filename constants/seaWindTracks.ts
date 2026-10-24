/**
 * @file constants/seaWindTracks.ts
 * @description Koridor polyline arah angin laut maritim Indonesia.
 * Menampilkan pola sirkulasi angin laut di perairan nusantara (Selat Karimata, Laut Jawa,
 * Selat Makassar, Samudera Hindia, Laut Flores, Laut Banda, Laut Arafura, dll.)
 */

export interface SeaWindTrack {
  id: string;
  name: string;
  seaRegion: string;
  coordinates: [number, number][];
  defaultSpeedKmh: number;
  defaultDegree: number;
  defaultCardinal: string;
}

export const INDONESIA_SEA_WIND_TRACKS: SeaWindTrack[] = [
  {
    id: 'sea-natuna',
    name: 'Laut Natuna & Selat Karimata Utara',
    seaRegion: 'Kepulauan Riau & Natuna',
    coordinates: [
      [4.2, 107.0],
      [3.1, 107.8],
      [1.8, 108.5],
      [0.6, 108.9],
    ],
    defaultSpeedKmh: 16.5,
    defaultDegree: 160,
    defaultCardinal: 'SSE',
  },
  {
    id: 'sea-karimata',
    name: 'Selat Karimata',
    seaRegion: 'Bangka Belitung - Kalbar',
    coordinates: [
      [0.2, 108.6],
      [-1.2, 109.1],
      [-2.6, 109.8],
      [-3.8, 110.5],
    ],
    defaultSpeedKmh: 15.0,
    defaultDegree: 150,
    defaultCardinal: 'SE',
  },
  {
    id: 'sea-jawa-barat',
    name: 'Laut Jawa (Sektor Barat)',
    seaRegion: 'Perairan DKI - Cirebon',
    coordinates: [
      [-5.1, 106.0],
      [-5.3, 107.5],
      [-5.6, 109.2],
    ],
    defaultSpeedKmh: 14.0,
    defaultDegree: 105,
    defaultCardinal: 'ESE',
  },
  {
    id: 'sea-jawa-timur',
    name: 'Laut Jawa (Sektor Timur & Selat Madura)',
    seaRegion: 'Perairan Semarang - Surabaya',
    coordinates: [
      [-5.8, 109.8],
      [-6.2, 112.2],
      [-6.6, 114.5],
    ],
    defaultSpeedKmh: 15.5,
    defaultDegree: 110,
    defaultCardinal: 'ESE',
  },
  {
    id: 'sea-selat-sunda',
    name: 'Selat Sunda',
    seaRegion: 'Perairan Lampung - Banten',
    coordinates: [
      [-6.9, 104.6],
      [-6.2, 105.3],
      [-5.5, 106.1],
    ],
    defaultSpeedKmh: 17.0,
    defaultDegree: 60,
    defaultCardinal: 'ENE',
  },
  {
    id: 'sea-hindia-barat-sumut',
    name: 'Samudera Hindia (Barat Aceh & Sumut)',
    seaRegion: 'Perairan Nias - Mentawai',
    coordinates: [
      [3.5, 95.2],
      [2.0, 96.8],
      [0.2, 98.2],
    ],
    defaultSpeedKmh: 18.5,
    defaultDegree: 135,
    defaultCardinal: 'SE',
  },
  {
    id: 'sea-hindia-barat-sumsel',
    name: 'Samudera Hindia (Pesisir Bengkulu & Lampung)',
    seaRegion: 'Pesisir Barat Sumatera',
    coordinates: [
      [-1.2, 99.2],
      [-3.0, 100.8],
      [-4.8, 102.5],
      [-6.2, 103.8],
    ],
    defaultSpeedKmh: 19.0,
    defaultDegree: 130,
    defaultCardinal: 'SE',
  },
  {
    id: 'sea-hindia-selatan-jawa',
    name: 'Samudera Hindia (Selatan Jawa & Bali)',
    seaRegion: 'Perairan Samudera Selatan Jawa',
    coordinates: [
      [-8.8, 106.2],
      [-9.0, 109.2],
      [-9.2, 112.5],
      [-9.4, 115.8],
    ],
    defaultSpeedKmh: 21.0,
    defaultDegree: 115,
    defaultCardinal: 'ESE',
  },
  {
    id: 'sea-makassar-utara',
    name: 'Selat Makassar (Sektor Utara)',
    seaRegion: 'Kaltim - Sulteng',
    coordinates: [
      [1.5, 118.8],
      [0.4, 119.1],
      [-0.8, 118.9],
    ],
    defaultSpeedKmh: 14.5,
    defaultDegree: 185,
    defaultCardinal: 'S',
  },
  {
    id: 'sea-makassar-selatan',
    name: 'Selat Makassar (Sektor Selatan)',
    seaRegion: 'Kalsel - Sulsel',
    coordinates: [
      [-1.6, 118.6],
      [-3.0, 118.3],
      [-4.6, 117.9],
    ],
    defaultSpeedKmh: 16.0,
    defaultDegree: 190,
    defaultCardinal: 'S',
  },
  {
    id: 'sea-flores-sawu',
    name: 'Laut Flores & Laut Sawu',
    seaRegion: 'Nusa Tenggara Barat & Timur',
    coordinates: [
      [-7.8, 117.0],
      [-7.9, 119.5],
      [-8.2, 122.0],
      [-8.8, 124.0],
    ],
    defaultSpeedKmh: 18.0,
    defaultDegree: 105,
    defaultCardinal: 'ESE',
  },
  {
    id: 'sea-banda',
    name: 'Laut Banda',
    seaRegion: 'Perairan Kepulauan Maluku',
    coordinates: [
      [-4.2, 126.2],
      [-4.8, 128.5],
      [-5.5, 131.0],
    ],
    defaultSpeedKmh: 17.5,
    defaultDegree: 110,
    defaultCardinal: 'ESE',
  },
  {
    id: 'sea-maluku',
    name: 'Laut Maluku & Halmahera',
    seaRegion: 'Sulut - Maluku Utara',
    coordinates: [
      [2.0, 126.2],
      [1.0, 127.2],
      [-0.4, 128.0],
    ],
    defaultSpeedKmh: 13.5,
    defaultDegree: 155,
    defaultCardinal: 'SSE',
  },
  {
    id: 'sea-sulawesi',
    name: 'Laut Sulawesi',
    seaRegion: 'Perairan Utara Sulawesi',
    coordinates: [
      [3.8, 121.8],
      [3.0, 123.5],
      [2.2, 125.2],
    ],
    defaultSpeedKmh: 15.0,
    defaultDegree: 90,
    defaultCardinal: 'E',
  },
  {
    id: 'sea-arafura',
    name: 'Laut Arafura',
    seaRegion: 'Perairan Selatan Papua - Merauke',
    coordinates: [
      [-7.5, 135.0],
      [-8.0, 137.8],
      [-8.5, 140.5],
    ],
    defaultSpeedKmh: 20.0,
    defaultDegree: 115,
    defaultCardinal: 'ESE',
  },
  {
    id: 'sea-pasifik-papua',
    name: 'Samudera Pasifik (Utara Papua)',
    seaRegion: 'Perairan Biak - Jayapura',
    coordinates: [
      [-0.8, 134.2],
      [-1.4, 137.2],
      [-2.0, 140.4],
    ],
    defaultSpeedKmh: 16.0,
    defaultDegree: 100,
    defaultCardinal: 'E',
  },
];
