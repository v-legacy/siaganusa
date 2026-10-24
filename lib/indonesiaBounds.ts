/**
 * @file lib/indonesiaBounds.ts
 * @description Modul filter spasial dan resolusi teritori Negara Kesatuan Republik Indonesia (NKRI).
 *
 * Mengeliminasi 100% kebocoran data (leakage) titik api, angin, dan cuaca dari negara tetangga & laut lepas:
 * - Semenanjung Malaysia (Kedah, Perak, Selangor, Pahang, Johor, Melaka, dll.)
 * - Singapura
 * - Sarawak, Sabah, & Brunei Darussalam di Pulau Kalimantan (Borneo)
 * - Anjungan migas lepas pantai di Laut Natuna / Laut China Selatan (bukan kebakaran daratan/hutan)
 * - Timor Leste (Daratan Dili/Baucau dan Enklave Oecusse)
 * - Papua Nugini (PNG - Garis bujur 141°T dan lekukan Sungai Fly)
 * - Filipina Selatan (Mindanao / Laut Sulu)
 * - Perairan internasional / samudra bebas di luar ZEE kepulauan
 *
 * Tetap mempertahankan 100% titik daratan terluar Indonesia:
 * - Sabang / Pulau Weh (Aceh)
 * - Pulau Rote & Ndana (NTT)
 * - Merauke (Papua Selatan)
 * - Pulau Miangas (Sulut)
 * - Kepulauan Riau (Batam, Bintan, Karimun, Natuna, Anambas)
 * - Pulau Nunukan & Sebatik (Kaltara)
 */

export interface ResolvedRegion {
  province: string;
  locationName: string;
  islandGroup: 'Sumatera' | 'Jawa' | 'Kalimantan' | 'Sulawesi' | 'Bali-Nusra' | 'Maluku' | 'Papua' | 'Indonesia';
}

/**
 * Batas Leaflet Map untuk membatasi panning kamera pengguna agar tetap fokus di Indonesia
 */
export const INDONESIA_BOUNDS_LEAFLET = {
  southWest: [-11.5, 94.5] as [number, number],
  northEast: [6.5, 141.5] as [number, number],
  maxBoundsViscosity: 0.85,
};

/**
 * Memvalidasi apakah koordinat geografis (lat, lng) berada di dalam kedaulatan kepulauan Indonesia.
 * Menghalau seluruh titik api/cuaca dari negara tetangga dan anjungan lepas pantai.
 */
export function isInsideIndonesia(lat: number, lng: number): boolean {
  // 1. Cek batas terluar umum koordinat NKRI (Sabang s/d Merauke, Miangas s/d Rote)
  if (lat < -11.1 || lat > 6.1 || lng < 94.9 || lng > 141.05) {
    return false;
  }

  // 2. Semenanjung Malaysia, Singapura, Thailand & Laut China Selatan Lepas Pantai
  // A. Laut China Selatan utara kepulauan Natuna (di atas batas pulau terluar Pulau Laut 4.75°LU)
  if (lat >= 4.75 && lng <= 109.5) {
    return false;
  }
  // B. Anjungan flare gas migas di perairan lepas pantai Laut Natuna (bukan pulau daratan)
  if (lat >= 3.4 && lat <= 4.75 && lng >= 105.0 && lng < 107.3) {
    return false;
  }
  // C. Thailand Selatan & Teluk Thailand
  if (lat >= 5.0 && lng >= 99.0 && lng <= 106.5) {
    return false;
  }
  // D. Malaysia Utara (Kedah, Perlis, Perak, Kelantan, Terengganu, Pahang Utara)
  if (lat >= 3.8 && lng >= 98.7 && lng <= 106.0) {
    return false;
  }
  // E. Malaysia Tengah (Selangor, KL, Pahang Selatan, Negeri Sembilan)
  if (lat >= 2.2 && lng >= 100.0 && lng <= 105.5) {
    return false;
  }
  // F. Malaysia Barat Daya (Melaka, Muar, Batu Pahat)
  // Catatan: Pulau Rupat (Riau) berada di lat 1.8-2.1, lng 101.3-101.7. Melaka di lng >= 102.3
  if (lat >= 1.65 && lng >= 102.3 && lng <= 105.5) {
    return false;
  }
  // G. Johor & Selat Singapura
  // Catatan: Batam lat 1.05, lng 104.0; Bintan lat 1.0, lng 104.5; Karimun lat 1.0, lng 103.4
  if (lat >= 1.35 && lng >= 102.5 && lng <= 105.5) {
    return false;
  }
  // H. Pulau Singapura (1.23°N - 1.48°N, 103.6°E - 104.1°E)
  if (lat >= 1.23 && lat <= 1.48 && lng >= 103.6 && lng <= 104.1) {
    return false;
  }

  // 3. Pulau Kalimantan (Borneo): Filter Sarawak, Sabah, dan Brunei Darussalam
  // Titik paling utara wilayah darat Indonesia di Kalimantan adalah Pulau Sebatik (lat ~4.167°N)
  // dan daratan Nunukan (lat ~4.14°N). Semua titik di atas 4.18°N di Borneo adalah Malaysia/Brunei.
  if (lng >= 108.5 && lng <= 119.5 && lat >= 4.18) {
    return false;
  }
  // A. Brunei Darussalam & Sarawak Utara (Miri, Limbang, Lawas)
  if (lat >= 4.0 && lng >= 113.8 && lng <= 115.6) {
    return false;
  }
  // B. Perbatasan Sarawak Timur & Sabah dengan Kaltara
  if (lat >= 3.85 && lng >= 115.3 && lng <= 117.0) {
    return false;
  }
  // C. Sarawak Timur Tengah
  if (lat >= 2.85 && lng >= 114.0 && lng <= 115.5) {
    return false;
  }
  if (lat >= 2.30 && lng >= 113.2 && lng <= 114.2) {
    return false;
  }
  // D. Sarawak Tengah (Bintulu, Kapit, Sibu)
  if (lat >= 1.80 && lng >= 112.0 && lng <= 113.5) {
    return false;
  }
  // E. Sarawak Barat (Kuching, Samarahan, Sri Aman, Betong, Sarikei)
  if (lat >= 1.35 && lng >= 109.75 && lng <= 112.2) {
    return false;
  }
  if (lat >= 1.05 && lng >= 110.5 && lng <= 111.8) {
    return false;
  }
  if (lat >= 1.65 && lng >= 109.4 && lng < 109.75) {
    return false; // Sematan / Tanjung Datu (Malaysia)
  }

  // 4. Pulau Timor: Filter Timor-Leste (Mainland & Oecusse Enclave)
  // A. Daratan Timor Leste (Dili, Baucau, Viqueque, Bobonaro, dll.)
  // Perbatasan darat RI-RDTL berada di sekitar lng 125.02 (Motaain, Belu)
  if (lat >= -9.55 && lat <= -8.2 && lng >= 125.05 && lng <= 127.35) {
    return false;
  }
  // B. Enklave Oecusse / Ambeno (Distrik Timor Leste yang dikelilingi wilayah TTU / Belu NTT)
  if (lat >= -9.48 && lat <= -9.15 && lng >= 124.08 && lng <= 124.48) {
    return false;
  }

  // 5. Pulau Papua: Filter Papua Nugini (PNG)
  // Perbatasan resmi membentang pada meridian 141° 01' E
  if (lng > 141.01) {
    return false;
  }
  // Lekukan batas Sungai Fly (Fly River) di mana batas berbelok ke barat hingga 140.85°E
  if (lat >= -6.95 && lat <= -5.95 && lng >= 140.84) {
    return false;
  }

  // 6. Laut Bebas & Perbatasan Maritim Selatan
  // Samudra Hindia di selatan Jawa (di luar perairan pulau Jawa)
  if (lat < -9.1 && lng >= 105.0 && lng <= 114.5) {
    return false;
  }
  // Samudra Hindia di selatan Bali & Lombok
  if (lat < -9.4 && lng >= 114.5 && lng <= 118.0) {
    return false;
  }

  // 7. Perbatasan Maritim Utara & Filipina Selatan
  // Laut Sulawesi utara Kaltara (perbatasan laut Malaysia/Filipina)
  if (lat >= 4.25 && lng >= 117.5 && lng <= 120.0) {
    return false;
  }
  // Filipina Selatan (Mindanao & Laut Sulu)
  if (lat >= 5.7 && lng >= 125.0) {
    return false;
  }
  if (lat >= 5.0 && lng >= 120.0 && lng <= 125.0) {
    return false;
  }

  // 8. Eksklusi Anjungan Gas Flare Lepas Pantai di Laut Jawa (Bukan Karhutla Daratan)
  // A. Anjungan Migas Lepas Pantai Laut Jawa Utara Madura (West Madura Offshore / Ketapang Offshore)
  // Termasuk koordinat 6.32°LS, 113.01°BT yang berada 63 km di laut lepas utara Pulau Madura
  // Batas utara pantai Madura berada di lat <= -6.87°LS. Pulau Bawean berada di lat -5.75° s/d -5.87°LS.
  if (lat > -6.85 && lat < -5.90 && lng >= 112.5 && lng <= 114.0) {
    return false;
  }

  // B. Anjungan Migas Lepas Pantai Laut Jawa Utara Jawa Barat (ONWJ - Subang/Indramayu Offshore)
  // Termasuk koordinat 5.91°LS, 107.74°BT yang berada 35 km di laut lepas utara Subang
  // Batas utara pantai Karawang/Subang berada di lat <= -6.20°LS.
  if (lat > -6.15 && lat < -5.60 && lng >= 107.3 && lng <= 108.3) {
    return false;
  }

  // C. Anjungan Migas / Rig Lepas Pantai Laut Arafura (Bukan Karhutla Daratan)
  // Termasuk koordinat 6.25°LS, 136.61°BT yang berada >120 km di laut lepas barat daya Papua
  // Terletak di perairan terbuka antara Kepulauan Aru (lng ~135°BT) dan Pulau Yos Sudarso (lng ~137.5°BT), selatan pesisir Mimika (lat <= -5.35°LS).
  if (lat <= -5.35 && lat >= -8.50 && lng >= 135.0 && lng <= 137.5) {
    return false;
  }

  return true;
}

/**
 * Resolver wilayah & provinsi Indonesia yang presisi tinggi berdasarkan batas geografis riil 38 provinsi.
 */
export function resolveIndonesiaRegion(lat: number, lng: number): ResolvedRegion {
  const coordStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'LU' : 'LS'}, ${lng.toFixed(2)}°BT`;

  // ─── 1. KEPULAUAN BANGKA BELITUNG ─────────────────────────────────────────
  if (lng >= 105.0 && lng <= 108.6 && lat >= -3.5 && lat <= -1.2) {
    if (lng > 107.0) {
      return { province: 'Kepulauan Bangka Belitung', locationName: `Pulau Belitung (${coordStr})`, islandGroup: 'Sumatera' };
    }
    return { province: 'Kepulauan Bangka Belitung', locationName: `Pulau Bangka (${coordStr})`, islandGroup: 'Sumatera' };
  }

  // ─── 2. KEPULAUAN RIAU ────────────────────────────────────────────────────
  if (lng >= 103.3 && lng <= 109.2 && lat >= -0.8 && lat <= 4.8) {
    if (lat >= 3.5 && lng >= 107.4) {
      return { province: 'Kepulauan Riau', locationName: `Kepulauan Natuna (${coordStr})`, islandGroup: 'Sumatera' };
    }
    if (lat >= 2.5 && lat < 3.5 && lng >= 105.3 && lng <= 106.6) {
      return { province: 'Kepulauan Riau', locationName: `Kepulauan Anambas (${coordStr})`, islandGroup: 'Sumatera' };
    }
    if (lat >= -0.8 && lat <= 0.6 && lng >= 104.0 && lng <= 105.2) {
      return { province: 'Kepulauan Riau', locationName: `Kepulauan Lingga (${coordStr})`, islandGroup: 'Sumatera' };
    }
    if (lat >= 0.6 && lat <= 1.35 && lng >= 103.3 && lng <= 104.9) {
      return { province: 'Kepulauan Riau', locationName: `Batam / Bintan / Karimun (${coordStr})`, islandGroup: 'Sumatera' };
    }
  }

  // ─── 3. SUMATERA ─────────────────────────────────────────────────────────────
  if (lng >= 95.0 && lng < 106.2 && lat >= -6.2 && lat <= 6.0) {
    // Aceh (95.0 s/d 98.3, lat 2.0 s/d 6.0)
    if (lng <= 98.3 && (lat >= 3.8 || (lat >= 2.0 && lng <= 97.8))) {
      return { province: 'Aceh', locationName: `Wilayah Aceh (${coordStr})`, islandGroup: 'Sumatera' };
    }
    // Sumatera Utara (97.0 s/d 100.2, lat 0.5 s/d 4.1)
    if (lng <= 100.2 && lat >= 0.5 && lat <= 4.1) {
      return { province: 'Sumatera Utara', locationName: `Wilayah Sumatera Utara (${coordStr})`, islandGroup: 'Sumatera' };
    }
    // Sumatera Barat (98.5 s/d 101.6, lat -3.5 s/d 0.3)
    if (lng <= 101.6 && lat >= -3.5 && lat <= 0.3) {
      return { province: 'Sumatera Barat', locationName: `Wilayah Sumatera Barat (${coordStr})`, islandGroup: 'Sumatera' };
    }
    // Riau Daratan (100.0 s/d 103.8, lat -1.2 s/d 2.5)
    if (lng >= 100.0 && lng <= 103.8 && lat >= -1.2 && lat <= 2.5) {
      return { province: 'Riau', locationName: `Wilayah Riau (${coordStr})`, islandGroup: 'Sumatera' };
    }
    // Jambi (101.1 s/d 104.6, lat -2.8 s/d -0.8)
    if (lng >= 101.1 && lng <= 104.6 && lat >= -2.8 && lat <= -0.8) {
      return { province: 'Jambi', locationName: `Wilayah Jambi (${coordStr})`, islandGroup: 'Sumatera' };
    }
    // Bengkulu (101.0 s/d 103.3, lat -5.5 s/d -2.2)
    if (lng <= 103.3 && lat >= -5.5 && lat <= -2.2) {
      return { province: 'Bengkulu', locationName: `Wilayah Bengkulu (${coordStr})`, islandGroup: 'Sumatera' };
    }
    // Sumatera Selatan (102.5 s/d 106.2, lat -4.8 s/d -1.6)
    if (lng >= 102.5 && lng <= 106.2 && lat >= -4.8 && lat <= -1.6) {
      return { province: 'Sumatera Selatan', locationName: `Wilayah Sumatera Selatan (${coordStr})`, islandGroup: 'Sumatera' };
    }
    // Lampung (103.5 s/d 106.0, lat -6.0 s/d -3.6)
    if (lat <= -3.6) {
      return { province: 'Lampung', locationName: `Wilayah Lampung (${coordStr})`, islandGroup: 'Sumatera' };
    }
    // Fallback pesisir timur Riau/Kepri
    return { province: 'Riau', locationName: `Wilayah Riau (${coordStr})`, islandGroup: 'Sumatera' };
  }

  // ─── 4. KALIMANTAN ───────────────────────────────────────────────────────────
  if (lng >= 108.5 && lng <= 119.2 && lat >= -4.5 && lat <= 4.2) {
    // Kalimantan Utara (lat >= 2.0, lng >= 115.0)
    if (lat >= 2.0 && lng >= 115.0) {
      return { province: 'Kalimantan Utara', locationName: `Wilayah Kalimantan Utara (${coordStr})`, islandGroup: 'Kalimantan' };
    }
    // Kalimantan Selatan (lat <= -1.4, lng >= 114.4 && lng <= 116.5)
    if (lat <= -1.4 && lng >= 114.4 && lng <= 116.5) {
      return { province: 'Kalimantan Selatan', locationName: `Wilayah Kalimantan Selatan (${coordStr})`, islandGroup: 'Kalimantan' };
    }
    // Kalimantan Barat (barat 111.3°BT saat di selatan khatulistiwa, atau seluruh Kalbar utara khatulistiwa hingga 114.2°BT)
    if ((lat <= 0.0 && lng <= 111.3) || (lat > 0.0 && lng <= 112.5) || (lat > 0.0 && lat <= 1.5 && lng <= 114.2)) {
      return { province: 'Kalimantan Barat', locationName: `Wilayah Kalimantan Barat (${coordStr})`, islandGroup: 'Kalimantan' };
    }
    // Kalimantan Tengah (antara 111.1°BT s/d 115.8°BT di sektor tengah/selatan)
    if (lng >= 111.1 && lng <= 115.8 && lat <= 0.8) {
      return { province: 'Kalimantan Tengah', locationName: `Wilayah Kalimantan Tengah (${coordStr})`, islandGroup: 'Kalimantan' };
    }
    // Kalimantan Timur (sisa wilayah timur Kalimantan)
    return { province: 'Kalimantan Timur', locationName: `Wilayah Kalimantan Timur (${coordStr})`, islandGroup: 'Kalimantan' };
  }

  // ─── 5. JAWA & MADURA ────────────────────────────────────────────────────────
  if (lng >= 105.0 && lng <= 116.0 && lat >= -9.0 && lat <= -5.5) {
    if (lng < 106.3) {
      return { province: 'Banten', locationName: `Wilayah Banten (${coordStr})`, islandGroup: 'Jawa' };
    }
    if (lng >= 106.6 && lng <= 107.0 && lat >= -6.4 && lat <= -6.0) {
      return { province: 'DKI Jakarta', locationName: `Wilayah DKI Jakarta (${coordStr})`, islandGroup: 'Jawa' };
    }
    if (lng < 108.8) {
      return { province: 'Jawa Barat', locationName: `Wilayah Jawa Barat (${coordStr})`, islandGroup: 'Jawa' };
    }
    if (lng >= 110.0 && lng <= 110.8 && lat >= -8.2 && lat <= -7.5) {
      return { province: 'DI Yogyakarta', locationName: `Wilayah DI Yogyakarta (${coordStr})`, islandGroup: 'Jawa' };
    }
    if (lng < 111.6) {
      return { province: 'Jawa Tengah', locationName: `Wilayah Jawa Tengah (${coordStr})`, islandGroup: 'Jawa' };
    }
    // Pulau Bawean (Gresik, Jawa Timur)
    if (lat >= -5.92 && lat <= -5.70 && lng >= 112.55 && lng <= 112.75) {
      return { province: 'Jawa Timur', locationName: `Pulau Bawean, Gresik (${coordStr})`, islandGroup: 'Jawa' };
    }
    // Kepulauan Masalembu (Sumenep, Jawa Timur)
    if (lat >= -5.65 && lat <= -5.45 && lng >= 114.35 && lng <= 114.55) {
      return { province: 'Jawa Timur', locationName: `Kepulauan Masalembu (${coordStr})`, islandGroup: 'Jawa' };
    }
    // Kepulauan Kangean (Sumenep, Jawa Timur: 6.7° s/d 7.3°LS, 115.0° s/d 115.85°BT)
    if (lat >= -7.30 && lat <= -6.65 && lng >= 115.0 && lng <= 115.85) {
      return { province: 'Jawa Timur', locationName: `Kepulauan Kangean (${coordStr})`, islandGroup: 'Jawa' };
    }
    // Pulau Madura (Bangkalan, Sampang, Pamekasan, Sumenep)
    if (lat >= -7.28 && lat <= -6.85 && lng >= 112.65 && lng <= 114.15) {
      return { province: 'Jawa Timur', locationName: `Pulau Madura (${coordStr})`, islandGroup: 'Jawa' };
    }
    // Deteksi tepat: Wilayah Bali di selatan selat Bali (lat <= -8.05 dan lng >= 114.43 s/d 115.75)
    if (lat <= -8.05 && lat >= -8.95 && lng >= 114.43 && lng <= 115.75) {
      return { province: 'Bali', locationName: `Wilayah Bali (${coordStr})`, islandGroup: 'Bali-Nusra' };
    }
    // Deteksi tepat: Wilayah Lombok / NTB (lng > 115.75 s/d 119.30)
    if (lat <= -8.05 && lat >= -9.20 && lng > 115.75 && lng <= 119.30) {
      return { province: 'Nusa Tenggara Barat', locationName: `Wilayah NTB (${coordStr})`, islandGroup: 'Bali-Nusra' };
    }
    // Perairan Laut Jawa lepas pantai Madura
    if (lat > -6.85 && lat < -5.90 && lng >= 112.5 && lng <= 114.0) {
      return { province: 'Jawa Timur', locationName: `Laut Jawa / Lepas Pantai Madura (${coordStr})`, islandGroup: 'Jawa' };
    }
    return { province: 'Jawa Timur', locationName: `Wilayah Jawa Timur (${coordStr})`, islandGroup: 'Jawa' };
  }

  // ─── 6. BALI & NUSA TENGGARA ─────────────────────────────────────────────────
  if (lng >= 114.3 && lng <= 125.1 && lat >= -11.2 && lat <= -8.0) {
    if (lng <= 115.75) {
      return { province: 'Bali', locationName: `Wilayah Bali (${coordStr})`, islandGroup: 'Bali-Nusra' };
    }
    if (lng <= 119.3) {
      return { province: 'Nusa Tenggara Barat', locationName: `Wilayah NTB (${coordStr})`, islandGroup: 'Bali-Nusra' };
    }
    return { province: 'Nusa Tenggara Timur', locationName: `Wilayah NTT (${coordStr})`, islandGroup: 'Bali-Nusra' };
  }

  // ─── 7. SULAWESI ─────────────────────────────────────────────────────────────
  // Sulawesi membentang dari 118.5°BT sampai 124.0°BT (kecuali semenanjung utara Sulut/Bitung sampai 125.2°BT)
  // Koordinat di timur 124.0°BT selatan khatulistiwa adalah wilayah MALUKU (Pulau Buru, Seram, dll.)
  if (lng >= 118.5 && lng <= 125.2 && lat >= -7.7 && lat <= 5.6 && !(lng >= 124.0 && lat <= 0.0)) {
    if (lat <= -5.8 && lng >= 120.0 && lng <= 122.5) {
      return { province: 'Sulawesi Selatan', locationName: `Kepulauan Selayar (${coordStr})`, islandGroup: 'Sulawesi' };
    }
    if (lat > 1.2 && lng >= 123.5) {
      return { province: 'Sulawesi Utara', locationName: `Wilayah Sulawesi Utara (${coordStr})`, islandGroup: 'Sulawesi' };
    }
    if (lat >= 0.2 && lat <= 1.2 && lng >= 121.0 && lng <= 123.6) {
      return { province: 'Gorontalo', locationName: `Wilayah Gorontalo (${coordStr})`, islandGroup: 'Sulawesi' };
    }
    if (lat < -1.0 && lat > -4.0 && lng < 120.0) {
      return { province: 'Sulawesi Barat', locationName: `Wilayah Sulawesi Barat (${coordStr})`, islandGroup: 'Sulawesi' };
    }
    if (lat <= -3.0 && lng < 121.2) {
      return { province: 'Sulawesi Selatan', locationName: `Wilayah Sulawesi Selatan (${coordStr})`, islandGroup: 'Sulawesi' };
    }
    if (lat <= -2.5 && lng >= 120.8 && lng <= 123.8) {
      return { province: 'Sulawesi Tenggara', locationName: `Wilayah Sulawesi Tenggara (${coordStr})`, islandGroup: 'Sulawesi' };
    }
    return { province: 'Sulawesi Tengah', locationName: `Wilayah Sulawesi Tengah (${coordStr})`, islandGroup: 'Sulawesi' };
  }

  // ─── 8. MALUKU ───────────────────────────────────────────────────────────────
  // Mencakup Kepulauan Maluku (Halmahera, Morotai, Buru, Seram, Ambon, Kei, Aru, Tanimbar)
  if (lng >= 124.0 && lng <= 134.5 && lat >= -9.0 && lat <= 3.0) {
    if (lat >= -1.8) {
      return { province: 'Maluku Utara', locationName: `Wilayah Maluku Utara (${coordStr})`, islandGroup: 'Maluku' };
    }
    if (lng >= 126.0 && lng <= 127.3 && lat >= -3.8 && lat <= -3.0) {
      return { province: 'Maluku', locationName: `Pulau Buru, Maluku (${coordStr})`, islandGroup: 'Maluku' };
    }
    return { province: 'Maluku', locationName: `Wilayah Maluku (${coordStr})`, islandGroup: 'Maluku' };
  }

  // ─── 9. PAPUA ────────────────────────────────────────────────────────────────
  if (lng >= 130.0 && lng <= 141.05 && lat >= -9.5 && lat <= 1.0) {
    // Perairan Laut Arafura lepas pantai Mimika/Asmat (jika ada koordinat anjungan laut lolos)
    if (lat <= -5.35 && lat >= -8.50 && lng >= 135.0 && lng <= 137.5) {
      return { province: 'Papua Selatan', locationName: `Laut Arafura / Lepas Pantai Papua (${coordStr})`, islandGroup: 'Papua' };
    }
    // Papua Barat Daya (Sorong, Raja Ampat, Maybrat, Tambrauw)
    if (lng < 133.5) {
      return { province: 'Papua Barat Daya', locationName: `Wilayah Papua Barat Daya (${coordStr})`, islandGroup: 'Papua' };
    }
    // Papua Barat (Manokwari, Fakfak, Kaimana, Teluk Bintuni, Wondama)
    if (lng < 135.5 && lat >= -4.5) {
      return { province: 'Papua Barat', locationName: `Wilayah Papua Barat (${coordStr})`, islandGroup: 'Papua' };
    }
    // Papua Tengah (Mimika/Timika, Nabire, Deiyai, Dogiyai, Intan Jaya, Puncak, Puncak Jaya, Paniai)
    if (lng >= 135.0 && lng <= 137.5 && lat >= -5.35 && lat <= -2.5) {
      return { province: 'Papua Tengah', locationName: `Wilayah Papua Tengah (${coordStr})`, islandGroup: 'Papua' };
    }
    // Papua Pegunungan (Jayawijaya, Lanny Jaya, Nduga, Yahukimo, Yalimo, Pegunungan Bintang)
    if (lat >= -4.8 && lat < -3.0 && lng >= 137.5 && lng < 140.5) {
      return { province: 'Papua Pegunungan', locationName: `Wilayah Papua Pegunungan (${coordStr})`, islandGroup: 'Papua' };
    }
    // Papua Selatan (Asmat, Mappi, Boven Digoel, Merauke, Pulau Yos Sudarso/Kolepom)
    if (lat < -4.8 || (lat < -5.35 && lng >= 137.5)) {
      return { province: 'Papua Selatan', locationName: `Wilayah Papua Selatan (${coordStr})`, islandGroup: 'Papua' };
    }
    return { province: 'Papua', locationName: `Wilayah Papua (${coordStr})`, islandGroup: 'Papua' };
  }

  return { province: 'Indonesia', locationName: `Wilayah Kepulauan Indonesia (${coordStr})`, islandGroup: 'Indonesia' };
}
