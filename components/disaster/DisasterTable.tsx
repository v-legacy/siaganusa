/**
 * @file components/disaster/DisasterTable.tsx
 * @description Tabel detail titik bencana dengan Panel Telemetri Terpilih yang modern,
 * atraktif, informatif, dan dioptimasi agar sangat mudah dibaca di mobile maupun desktop.
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  MapPin,
  Satellite,
  Clock,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  X,
  ExternalLink,
  Copy,
  Check,
  Wind,
  Thermometer,
  Droplets,
  ShieldAlert,
  ShieldCheck,
  Users,
  FileText,
  MessageCircle,
  Activity,
} from 'lucide-react';
import type { DisasterHotspot } from '@/types/disaster';
import type { LocationWeather } from '@/types/weather';
import type { AirQualityData } from '@/types/airQuality';

interface DisasterTableProps {
  hotspots: DisasterHotspot[];
  selectedId: string | null;
  selectedHotspot?: DisasterHotspot | null;
  selectedWeather?: LocationWeather | null;
  isLoadingWeather?: boolean;
  selectedAirQuality?: AirQualityData | null;
  isLoadingAirQuality?: boolean;
  onRowClick: (hotspot: DisasterHotspot) => void;
}

const CONFIDENCE_BADGE: Record<string, { label: string; className: string }> = {
  HIGH:   { label: 'Tinggi',  className: 'badge badge--high' },
  MEDIUM: { label: 'Sedang', className: 'badge badge--medium' },
  LOW:    { label: 'Rendah', className: 'badge badge--low' },
};

function degreeToCardinalName(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'Utara (N)';
  if (normalized >= 22.5 && normalized < 67.5) return 'Timur Laut (NE)';
  if (normalized >= 67.5 && normalized < 112.5) return 'Timur (E)';
  if (normalized >= 112.5 && normalized < 157.5) return 'Tenggara (SE)';
  if (normalized >= 157.5 && normalized < 202.5) return 'Selatan (S)';
  if (normalized >= 202.5 && normalized < 247.5) return 'Barat Daya (SW)';
  if (normalized >= 247.5 && normalized < 292.5) return 'Barat (W)';
  return 'Barat Laut (NW)';
}

export default function DisasterTable({
  hotspots,
  selectedId,
  selectedHotspot,
  selectedWeather,
  isLoadingWeather = false,
  selectedAirQuality,
  isLoadingAirQuality = false,
  onRowClick,
}: DisasterTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConf, setFilterConf] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [copiedSitRep, setCopiedSitRep] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const selectedRowRef = useRef<HTMLTableRowElement>(null);

  const ITEMS_PER_PAGE = 30;

  // Ambil objek hotspot aktif (dari prop atau dicari dari selectedId)
  const activeHotspot = selectedHotspot || hotspots.find((h) => h.id === selectedId);

  // Scroll baris terpilih ke dalam view tabel
  useEffect(() => {
    if (selectedId && selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedId, currentPage]);

  // Handler salin koordinat
  const handleCopyCoords = useCallback((lat: number, lng: number) => {
    const text = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    navigator.clipboard?.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  }, []);

  // Filter hotspot berdasarkan query dan confidence
  const filtered = hotspots.filter((h) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      !searchQuery ||
      h.locationName.toLowerCase().includes(q) ||
      h.province.toLowerCase().includes(q) ||
      (h.regency ?? '').toLowerCase().includes(q) ||
      (h.satellite ?? '').toLowerCase().includes(q);
    const matchConf = filterConf === 'ALL' || h.confidence === filterConf;
    return matchQuery && matchConf;
  });

  // Sesuaikan halaman paginasi saat filter, pencarian, atau hotspot terpilih berubah
  // Menggunakan pola resmi React untuk menyinkronkan state turunan tanpa cascading effect
  const [prevFilter, setPrevFilter] = useState({ query: searchQuery, conf: filterConf, selectedId });
  if (
    prevFilter.query !== searchQuery ||
    prevFilter.conf !== filterConf ||
    prevFilter.selectedId !== selectedId
  ) {
    let nextCurrentPage = 1;
    if (selectedId && prevFilter.selectedId !== selectedId) {
      const idx = filtered.findIndex((h) => h.id === selectedId);
      if (idx !== -1) {
        nextCurrentPage = Math.floor(idx / ITEMS_PER_PAGE) + 1;
      }
    }
    setPrevFilter({ query: searchQuery, conf: filterConf, selectedId });
    setCurrentPage(nextCurrentPage);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHotspots = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const formatTime = useCallback((isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  }, []);

  const formatDate = useCallback((isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }, []);

  // Hitung tingkat keparahan radiasi api (FRP)
  const frp = activeHotspot?.maxFrp ?? 0;
  const frpLevel = frp > 250 ? 'Ekstrem' : frp > 80 ? 'Tinggi' : frp > 30 ? 'Sedang' : 'Rendah';
  const frpPercent = Math.min(100, Math.round((frp / 400) * 100));

  // Arah perambatan api & sekat basah taktis
  const blowTowardsDeg = selectedWeather ? (selectedWeather.windDirectionDegree + 180) % 360 : 0;
  const blowTowardsCardinal = selectedWeather ? degreeToCardinalName(blowTowardsDeg) : '';

  // Hitung radius paparan panas dan jarak sekat basah taktis
  let bboxRadiusMeters = 0;
  if (activeHotspot?.bbox && Array.isArray(activeHotspot.bbox) && activeHotspot.bbox.length === 4) {
    const [minLng, minLat, maxLng, maxLat] = activeHotspot.bbox;
    if (Math.abs(maxLng - minLng) > 0.001 || Math.abs(maxLat - minLat) > 0.001) {
      const dLatKm = Math.max(Math.abs(maxLat - activeHotspot.latitude), Math.abs(minLat - activeHotspot.latitude)) * 111;
      const dLngKm = Math.max(Math.abs(maxLng - activeHotspot.longitude), Math.abs(minLng - activeHotspot.longitude)) * 111 * Math.cos((activeHotspot.latitude * Math.PI) / 180);
      bboxRadiusMeters = Math.sqrt(dLatKm * dLatKm + dLngKm * dLngKm) * 1000;
    }
  }

  const radiusMeters = activeHotspot
    ? bboxRadiusMeters > 0
      ? bboxRadiusMeters + Math.max(1500, Math.min(5000, (activeHotspot.maxFrp ? Math.sqrt(activeHotspot.maxFrp) * 60 : 2000)))
      : Math.max(800, Math.min(4500, (activeHotspot.count || 1) * 400 + (activeHotspot.maxFrp ? Math.sqrt(activeHotspot.maxFrp) * 25 : 0)))
    : 1000;
  const radiusKm = radiusMeters / 1000;
  const tacticalWindOffset = selectedWeather ? Math.max(0.8, Math.min(4.5, (selectedWeather.windSpeedKmh / 10) * 1.5)) : 1.2;
  const wettingDistKm = radiusKm + tacticalWindOffset;
  const wettingDistMeters = Math.round(wettingDistKm * 1000);

  // Generator Laporan Situasi (SitRep) WhatsApp Lapangan
  const generateSitRepText = useCallback(() => {
    if (!activeHotspot) return '';

    const timeStr = formatTime(activeHotspot.detectedAt);
    const dateStr = formatDate(activeHotspot.detectedAt);
    const confBadge = CONFIDENCE_BADGE[activeHotspot.confidence]?.label || 'Sedang';
    const confVal = activeHotspot.confidenceValue ?? 85;
    const frpStr = activeHotspot.maxFrp ? `${activeHotspot.maxFrp.toFixed(1)} MW` : 'Tidak Terukur';
    const gmapsUrl = `https://www.google.com/maps?q=${activeHotspot.latitude.toFixed(5)},${activeHotspot.longitude.toFixed(5)}`;

    const airQualityInfo = selectedAirQuality
      ? `• Indeks ISPU: *${selectedAirQuality.ispuValue} — ${selectedAirQuality.ispuInfo.label.toUpperCase()}* (US AQI: ${selectedAirQuality.usAqi})\n• Konsentrasi Partikulat:\n  - PM2.5 (Asap Halus): *${selectedAirQuality.pm25} μg/m³*\n  - PM10 (Debu & Abu): *${selectedAirQuality.pm10} μg/m³*\n  - Karbon Monoksida (CO): *${selectedAirQuality.carbonMonoxide.toLocaleString('id-ID')} μg/m³*\n• Rekomendasi Medis: ${selectedAirQuality.ispuInfo.healthRecommendation}\n• Standar Masker: *${selectedAirQuality.ispuInfo.maskRecommendation}*`
      : isLoadingAirQuality
      ? '• Kualitas Udara: Sedang memuat telemetri ISPU...'
      : '• Kualitas Udara: Data stasiun pemantau belum tersedia';

    const windInfo = selectedWeather
      ? `• Kecepatan Angin: ${selectedWeather.windSpeedKmh} km/jam\n• Arah Asal Angin: ${selectedWeather.windDirectionCardinal} (${selectedWeather.windDirectionDegree}°)\n• Proyeksi Tiupan: Menuju *${blowTowardsCardinal}* (${blowTowardsDeg}°)\n• Suhu & Kelembapan: ${selectedWeather.temperatureCelsius}°C | ${selectedWeather.relativeHumidity}% RH`
      : '• Data Cuaca: Sedang dimuat atau belum tersedia';

    const wettingInfo = selectedWeather
      ? `• Batas Rekomendasi Sekat Basah: *~${wettingDistKm.toFixed(1)} km (${wettingDistMeters} m)* di sektor tiupan *${blowTowardsCardinal}*\n• Tindakan Prioritas: Lakukan pembasahan tanah gambut / pemotongan bahan bakar kering selebar 25-50 m sebelum lidah api tiba.`
      : '• Rekomendasi Taktis: Basahi area vegetasi kering di depan arah perambatan api.';

    return `🚨 *LAPORAN SITUASI KARHUTLA (SITREP) — SIAGANUSA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 *Lokasi:* ${activeHotspot.locationName}
🗺️ *Wilayah:* ${activeHotspot.province}${activeHotspot.regency ? `, ${activeHotspot.regency}` : ''}
📌 *Koordinat GPS:* ${activeHotspot.latitude.toFixed(5)}°, ${activeHotspot.longitude.toFixed(5)}°
🕒 *Waktu Deteksi:* ${timeStr} WIB (${dateStr})
🛰️ *Sensor Satelit:* ${activeHotspot.satellite} (${activeHotspot.count ?? 1} titik kluster)

🔥 *INTENSITAS RADIASI & BAHAYA:*
• Daya Radiasi Termal (FRP): *${frpStr}* (${frpLevel})
• Tingkat Keyakinan: *${confBadge} (${confVal}%)*
• Radius Bahaya Panas & Asap: *~${radiusKm.toFixed(1)} km* (${Math.round(radiusMeters)} m)

🌫️ *KUALITAS UDARA & KONSENTRASI ASAP (ISPU):*
${airQualityInfo}

💨 *KONDISI ANGIN & CUACA (Live Open-Meteo):*
${windInfo}

🛡️ *STRATEGI PEMADAMAN (SEKAT BASAH):*
${wettingInfo}
• Himbauan Warga: ${selectedAirQuality ? selectedAirQuality.ispuInfo.maskRecommendation : 'Gunakan masker N95'}, waspada sebaran asap tebal di sektor *${blowTowardsCardinal || 'rambatan'}*.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗺️ *Tautan Google Maps:* ${gmapsUrl}
_Laporan dibuat otomatis via SiagaNusa (Sistem Komando Pantau Karhutla Indonesia)_`;
  }, [
    activeHotspot,
    formatTime,
    formatDate,
    frpLevel,
    selectedAirQuality,
    isLoadingAirQuality,
    selectedWeather,
    blowTowardsCardinal,
    blowTowardsDeg,
    wettingDistKm,
    wettingDistMeters,
    radiusKm,
    radiusMeters,
  ]);

  const handleCopySitRep = useCallback(() => {
    const text = generateSitRepText();
    if (!text) return;
    navigator.clipboard?.writeText(text);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
    setCopiedSitRep(true);
    setTimeout(() => setCopiedSitRep(false), 2500);
  }, [generateSitRepText]);

  return (
    <section className="disaster-table-section" aria-label="Tabel rincian titik api">
      {/* ─── Header tabel dengan toggle expand ─────────────────────────────── */}
      <div className="table-header">
        <div className="table-header-left">
          <h2 className="table-title">
            <span className="table-title-icon" aria-hidden="true">📋</span>
            Rincian Titik Api Karhutla
          </h2>
          <span className="table-count-badge" aria-label={`${filtered.length} titik ditemukan`}>
            {filtered.length.toLocaleString('id-ID')} titik aktif
          </span>
        </div>
        <button
          id="btn-toggle-table"
          className="table-expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Ciutkan tabel' : 'Perluas tabel'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {/* ─── Baris filter & pencarian ──────────────────────────────────────── */}
      <div className="table-filters" role="search" aria-label="Filter titik api">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" aria-hidden="true" />
          <input
            id="input-search-hotspot"
            type="search"
            className="search-input"
            placeholder="Cari lokasi, provinsi, atau sensor satelit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Cari titik api berdasarkan lokasi"
          />
        </div>
        <div className="filter-chips" role="group" aria-label="Filter tingkat keparahan">
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((conf) => (
            <button
              key={conf}
              id={`btn-filter-${conf.toLowerCase()}`}
              className={`filter-chip filter-chip--${conf.toLowerCase()} ${filterConf === conf ? 'filter-chip--active' : ''}`}
              onClick={() => setFilterConf(conf)}
              aria-pressed={filterConf === conf}
            >
              {conf === 'ALL' ? 'Semua' : conf === 'HIGH' ? '🔴 Tinggi' : conf === 'MEDIUM' ? '🟠 Sedang' : '🟡 Rendah'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Panel Info Detail Hotspot Terpilih (Desain Menarik & Mudah Dibaca) ─── */}
      {activeHotspot && (
        <div className="selected-hotspot-panel" role="region" aria-label="Panel Detail Titik Api Terpilih">
          {/* Header Kartu Detail */}
          <div className="shp-header">
            <div className="shp-header-left">
              <div className="shp-flame-circle">
                <Flame size={20} className="shp-flame-icon-pulse" />
              </div>
              <div>
                <div className="shp-location-row">
                  <h3 className="shp-title">{activeHotspot.locationName}</h3>
                  <span className={CONFIDENCE_BADGE[activeHotspot.confidence]?.className || 'badge'}>
                    🔥 Keyakinan {CONFIDENCE_BADGE[activeHotspot.confidence]?.label} ({activeHotspot.confidenceValue ?? 90}%)
                  </span>
                </div>
                <div className="shp-subtitle-row">
                  <span className="shp-geo-tag">📍 {activeHotspot.province}</span>
                  {activeHotspot.regency && <span className="shp-geo-tag">· {activeHotspot.regency}</span>}
                  <span className="shp-id-tag">ID: {activeHotspot.id}</span>
                </div>
              </div>
            </div>

            <div className="shp-header-right">
              <button
                onClick={() => onRowClick({ ...activeHotspot, id: '' })}
                className="shp-close-btn"
                title="Tutup rincian titik api"
                aria-label="Tutup rincian"
              >
                <X size={16} />
                <span className="shp-close-text">Tutup</span>
              </button>
            </div>
          </div>

          {/* Pengukur Intensitas FRP (Fire Radiative Power Bar) */}
          <div className="shp-frp-bar-wrapper">
            <div className="shp-frp-bar-label">
              <span>Intensitas Daya Panas (FRP): <b>{frp ? `${frp.toFixed(1)} MW` : 'Tidak terukur'}</b></span>
              <span className={`shp-frp-badge shp-frp-badge--${frpLevel.toLowerCase()}`}>
                Kategori {frpLevel}
              </span>
            </div>
            <div className="shp-frp-track" role="progressbar" aria-valuenow={frpPercent} aria-valuemin={0} aria-valuemax={100}>
              <div className="shp-frp-fill" style={{ width: `${Math.max(8, frpPercent)}%` }} />
            </div>
          </div>

          {/* Grid Informasi Detail Terstruktur */}
          <div className="shp-grid">
            {/* Box 1: Waktu & Satelit */}
            <div className="shp-item">
              <div className="shp-item-top">
                <Clock size={14} className="shp-item-icon text-muted" />
                <span className="shp-label">Waktu Deteksi</span>
              </div>
              <strong className="shp-val">{formatTime(activeHotspot.detectedAt)} WIB</strong>
              <span className="shp-subval">{formatDate(activeHotspot.detectedAt)}</span>
            </div>

            {/* Box 2: Sensor Satelit */}
            <div className="shp-item">
              <div className="shp-item-top">
                <Satellite size={14} className="shp-item-icon text-blue" />
                <span className="shp-label">Sensor & Kluster</span>
              </div>
              <strong className="shp-val">{activeHotspot.satellite}</strong>
              <span className="shp-subval">{activeHotspot.count ?? 1} deteksi dalam kluster</span>
            </div>

            {/* Box 3: Cuaca & Arah Angin */}
            <div className="shp-item shp-item--weather">
              <div className="shp-item-top">
                <Wind size={14} className="shp-item-icon text-wind" />
                <span className="shp-label">Kecepatan & Suhu</span>
              </div>
              {isLoadingWeather ? (
                <strong className="shp-val text-muted">Memuat cuaca...</strong>
              ) : selectedWeather ? (
                <>
                  <strong className="shp-val">
                    {selectedWeather.windSpeedKmh} km/jam
                  </strong>
                  <span className="shp-subval">
                    <Thermometer size={10} style={{ display: 'inline' }} /> {selectedWeather.temperatureCelsius}°C ·{' '}
                    <Droplets size={10} style={{ display: 'inline' }} /> {selectedWeather.relativeHumidity}%
                  </span>
                </>
              ) : (
                <strong className="shp-val text-muted">-</strong>
              )}
            </div>

            {/* Box 4: Koordinat & Navigasi */}
            <div className="shp-item">
              <div className="shp-item-top">
                <MapPin size={14} className="shp-item-icon text-red" />
                <span className="shp-label">Koordinat Presisi</span>
              </div>
              <strong className="shp-val font-mono">
                {activeHotspot.latitude.toFixed(4)}°, {activeHotspot.longitude.toFixed(4)}°
              </strong>
              <div className="shp-actions-row">
                <button
                  onClick={() => handleCopyCoords(activeHotspot.latitude, activeHotspot.longitude)}
                  className="shp-action-btn"
                  title="Salin koordinat"
                >
                  {copiedCoords ? <Check size={11} className="text-green" /> : <Copy size={11} />}
                  <span>{copiedCoords ? 'Tersalin!' : 'Salin'}</span>
                </button>
                <a
                  href={`https://www.google.com/maps?q=${activeHotspot.latitude},${activeHotspot.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shp-action-btn shp-action-btn--link"
                >
                  <ExternalLink size={11} />
                  <span>Google Maps</span>
                </a>
              </div>
            </div>
          </div>

          {/* ─── Fitur D: Indikator Kualitas Udara & Konsentrasi Asap (ISPU / AQI PM2.5) ─── */}
          {selectedAirQuality ? (
            <div className="shp-ispu-card" role="region" aria-label="Indikator Kualitas Udara dan Konsentrasi Asap">
              <div className="shp-ispu-header">
                <div className="shp-ispu-title-group">
                  <span
                    className="shp-ispu-icon-badge"
                    style={{
                      backgroundColor: selectedAirQuality.ispuInfo.bgColor,
                      color: selectedAirQuality.ispuInfo.color,
                      borderColor: selectedAirQuality.ispuInfo.borderColor,
                    }}
                    aria-hidden="true"
                  >
                    <Activity size={16} />
                  </span>
                  <div>
                    <h4 className="shp-ispu-title">
                      Kualitas Udara &amp; Konsentrasi Asap
                      <span
                        className="shp-ispu-badge"
                        style={{
                          backgroundColor: selectedAirQuality.ispuInfo.color,
                        }}
                      >
                        ISPU {selectedAirQuality.ispuValue} · {selectedAirQuality.ispuInfo.label.toUpperCase()}
                      </span>
                    </h4>
                    <p className="shp-ispu-subtitle">
                      Baku mutu Indeks Standar Pencemar Udara (Permen LHK No. 14/2020) via Open-Meteo Air Quality
                    </p>
                  </div>
                </div>

                <div className="shp-ispu-meta">
                  <span className="shp-ispu-aqi-pill" title="Indeks Kualitas Udara Global (US AQI)">
                    US AQI: <b>{selectedAirQuality.usAqi}</b>
                  </span>
                  <span className="shp-ispu-aqi-pill" title="European Air Quality Index">
                    EU AQI: <b>{selectedAirQuality.europeanAqi}</b>
                  </span>
                </div>
              </div>

              {/* Skala Visual Meter Segmen ISPU */}
              <div className="shp-ispu-scale-wrapper">
                <div
                  className="shp-ispu-scale-bar"
                  role="meter"
                  aria-valuenow={selectedAirQuality.ispuValue}
                  aria-valuemin={0}
                  aria-valuemax={400}
                  aria-label={`Nilai ISPU ${selectedAirQuality.ispuValue} kategori ${selectedAirQuality.ispuInfo.label}`}
                >
                  <div className="shp-ispu-segment shp-ispu-segment--baik" title="0-50: Baik">
                    <span>Baik (0-50)</span>
                  </div>
                  <div className="shp-ispu-segment shp-ispu-segment--sedang" title="51-100: Sedang">
                    <span>Sedang (51-100)</span>
                  </div>
                  <div className="shp-ispu-segment shp-ispu-segment--tidak-sehat" title="101-200: Tidak Sehat">
                    <span>Tdk Sehat (101-200)</span>
                  </div>
                  <div className="shp-ispu-segment shp-ispu-segment--sangat-tidak-sehat" title="201-300: Sangat Tidak Sehat">
                    <span>Sgt Tdk Sehat</span>
                  </div>
                  <div className="shp-ispu-segment shp-ispu-segment--berbahaya" title=">300: Berbahaya">
                    <span>Berbahaya (&gt;300)</span>
                  </div>

                  {/* Pin Penunjuk Posisi Nilai ISPU Saat Ini */}
                  <div
                    className="shp-ispu-pin"
                    style={{
                      left: `${Math.min(96, Math.max(4, (selectedAirQuality.ispuValue / 350) * 100))}%`,
                    }}
                  >
                    <div className="shp-ispu-pin-thumb" style={{ backgroundColor: selectedAirQuality.ispuInfo.color }} />
                    <div className="shp-ispu-pin-label">{selectedAirQuality.ispuValue}</div>
                  </div>
                </div>
              </div>

              {/* Grid 3 Konsentrasi Partikulat Asap Karhutla */}
              <div className="shp-ispu-grid">
                <div className="shp-ispu-metric-item">
                  <div className="shp-ispu-metric-header">
                    <span className="shp-ispu-metric-name">PM2.5 (Partikel Halus)</span>
                    <span className="shp-ispu-metric-tag shp-ispu-metric-tag--danger">Kritis Paru</span>
                  </div>
                  <div className="shp-ispu-metric-value-row">
                    <span className="shp-ispu-metric-num" style={{ color: selectedAirQuality.ispuInfo.color }}>
                      {selectedAirQuality.pm25}
                    </span>
                    <span className="shp-ispu-metric-unit">μg/m³</span>
                  </div>
                  <p className="shp-ispu-metric-desc">Partikel jelaga mikro asap kebakaran yang mudah masuk ke kantung udara paru-paru.</p>
                </div>

                <div className="shp-ispu-metric-item">
                  <div className="shp-ispu-metric-header">
                    <span className="shp-ispu-metric-name">PM10 (Debu &amp; Jelaga)</span>
                    <span className="shp-ispu-metric-tag">Saluran Napas</span>
                  </div>
                  <div className="shp-ispu-metric-value-row">
                    <span className="shp-ispu-metric-num">{selectedAirQuality.pm10}</span>
                    <span className="shp-ispu-metric-unit">μg/m³</span>
                  </div>
                  <p className="shp-ispu-metric-desc">Partikel abu dan debu hasil pembakaran vegetasi yang memicu batuk dan perih.</p>
                </div>

                <div className="shp-ispu-metric-item">
                  <div className="shp-ispu-metric-header">
                    <span className="shp-ispu-metric-name">Karbon Monoksida (CO)</span>
                    <span className="shp-ispu-metric-tag">Gas Karhutla</span>
                  </div>
                  <div className="shp-ispu-metric-value-row">
                    <span className="shp-ispu-metric-num">{selectedAirQuality.carbonMonoxide.toLocaleString('id-ID')}</span>
                    <span className="shp-ispu-metric-unit">μg/m³</span>
                  </div>
                  <p className="shp-ispu-metric-desc">Gas hasil pembakaran tanah gambut dan biomassa vegetasi tidak sempurna.</p>
                </div>
              </div>

              {/* Kotak Protokol Proteksi & Panduan Kesehatan Lapangan (Grid 3 Kartu) */}
              <div className="shp-ispu-advisory-grid">
                {/* Kartu 1: Standar Masker */}
                <div
                  className="shp-ispu-advisory-card"
                  style={{
                    borderTopColor: selectedAirQuality.ispuInfo.color,
                  }}
                >
                  <div className="shp-ispu-advisory-header">
                    <span className="shp-ispu-advisory-icon" aria-hidden="true">😷</span>
                    <span className="shp-ispu-advisory-title">Standar Masker</span>
                  </div>
                  <div
                    className={`shp-ispu-advisory-highlight-badge shp-ispu-advisory-highlight-badge--${selectedAirQuality.ispuCategory.toLowerCase()}`}
                  >
                    {selectedAirQuality.ispuInfo.maskRecommendation}
                  </div>
                  <p className="shp-ispu-advisory-desc">
                    Standar APD pernapasan resmi untuk menyaring partikulat mikro jelaga asap karhutla.
                  </p>
                </div>

                {/* Kartu 2: Dampak Kesehatan */}
                <div className="shp-ispu-advisory-card">
                  <div className="shp-ispu-advisory-header">
                    <span className="shp-ispu-advisory-icon" aria-hidden="true">🏥</span>
                    <span className="shp-ispu-advisory-title">Dampak Kesehatan</span>
                  </div>
                  <p className="shp-ispu-advisory-text">
                    {selectedAirQuality.ispuInfo.healthRecommendation}
                  </p>
                  <p className="shp-ispu-advisory-desc">
                    Waspada gejala batuk, iritasi mata, dan sesak napas akut di area terdampak asap.
                  </p>
                </div>

                {/* Kartu 3: Mitigasi Warga Rentan */}
                <div className="shp-ispu-advisory-card">
                  <div className="shp-ispu-advisory-header">
                    <span className="shp-ispu-advisory-icon" aria-hidden="true">🛡️</span>
                    <span className="shp-ispu-advisory-title">Warga Rentan</span>
                  </div>
                  <p className="shp-ispu-advisory-text">
                    {selectedAirQuality.ispuInfo.vulnerableGroupGuidance}
                  </p>
                  <p className="shp-ispu-advisory-desc">
                    Prioritaskan balita, ibu hamil, dan lansia untuk evakuasi ke shelter berfilter HEPA.
                  </p>
                </div>
              </div>
            </div>
          ) : isLoadingAirQuality ? (
            <div className="shp-ispu-loading-card">
              <div className="shp-ispu-loading-spinner" aria-hidden="true" />
              <span>Memuat konsentrasi kualitas udara &amp; ISPU titik api...</span>
            </div>
          ) : null}

          {/* ─── Fitur A: Generator Laporan Situasi Lapangan (SitRep WhatsApp) ─── */}
          <div className="shp-sitrep-card" role="region" aria-label="Generator Laporan Situasi Lapangan">
            <div className="shp-sitrep-header">
              <div className="shp-sitrep-title-group">
                <span className="shp-sitrep-icon-badge" aria-hidden="true">
                  <FileText size={15} />
                </span>
                <div>
                  <h4 className="shp-sitrep-title">
                    Laporan Situasi Lapangan (SitRep)
                    <span className="shp-sitrep-badge">WhatsApp Ready</span>
                  </h4>
                  <p className="shp-sitrep-desc">
                    Format terstruktur siap kirim ke grup koordinasi BPBD, Babinsa, Danramil, atau pimpinan satgas.
                  </p>
                </div>
              </div>

              <div className="shp-sitrep-actions">
                <button
                  type="button"
                  id="btn-copy-sitrep"
                  onClick={handleCopySitRep}
                  className={`shp-sitrep-btn ${copiedSitRep ? 'shp-sitrep-btn--copied' : 'shp-sitrep-btn--copy'}`}
                  title="Salin teks laporan situasi ke clipboard"
                >
                  {copiedSitRep ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedSitRep ? 'Laporan Tersalin!' : 'Salin Laporan'}</span>
                </button>

                <a
                  id="btn-send-sitrep-wa"
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(generateSitRepText())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shp-sitrep-btn shp-sitrep-btn--wa"
                  title="Buka langsung WhatsApp Web atau Desktop dan kirim laporan"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                      navigator.vibrate(20);
                    }
                  }}
                >
                  <MessageCircle size={15} />
                  <span>Kirim ke WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* ─── Widget Instrumen Arah Angin & Kompas Aerodinamis Beranimasi Motion ─── */}
          {selectedWeather && (
            <div className="shp-wind-instrument-card">
              <div className="shp-wind-compass-wrapper">
                {/* Dial Kompas 360 Derajat */}
                <div className="shp-wind-compass-dial" role="img" aria-label={`Kompas arah angin menunjuk ${blowTowardsCardinal} (${blowTowardsDeg} derajat)`}>
                  {/* Cardinal Points */}
                  <span className="shp-compass-label shp-compass-label--n">U</span>
                  <span className="shp-compass-label shp-compass-label--e">T</span>
                  <span className="shp-compass-label shp-compass-label--s">S</span>
                  <span className="shp-compass-label shp-compass-label--w">B</span>

                  {/* Ring pendaran kompas */}
                  <div className="shp-compass-pulse-ring" />

                  {/* Icon Arah Angin Aerodinamis dengan Efek Motion Berayun */}
                  <div
                    className="shp-wind-vane-needle"
                    style={{
                      transform: `rotate(${blowTowardsDeg}deg)`,
                    }}
                  >
                    <div className="shp-wind-vane-motion">
                      <svg
                        width="38"
                        height="38"
                        viewBox="0 0 40 40"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="shp-wind-vane-svg"
                      >
                        <defs>
                          <linearGradient id="vaneGrad" x1="20" y1="2" x2="20" y2="38" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#38BDF8" />
                            <stop offset="50%" stopColor="#2563EB" />
                            <stop offset="100%" stopColor="#1E3A8A" />
                          </linearGradient>
                          <filter id="vaneGlow" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse">
                            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38BDF8" floodOpacity="0.8" />
                          </filter>
                        </defs>
                        {/* Ekor hembusan angin ganda */}
                        <path d="M16 34C16 34 18 28 18 24" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
                        <path d="M24 34C24 34 22 28 22 24" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
                        {/* Kepala Aerodynamic Jet Stream */}
                        <path
                          d="M20 4L27 22C27 22 22 19 20 19C18 19 13 22 13 22L20 4Z"
                          fill="url(#vaneGrad)"
                          stroke="#FFFFFF"
                          strokeWidth="1.6"
                          strokeLinejoin="round"
                          filter="url(#vaneGlow)"
                        />
                        {/* Core Partikel Angin */}
                        <circle cx="20" cy="14" r="2.5" fill="#FFFFFF" />
                      </svg>
                    </div>
                  </div>

                  {/* Titik pusat poros kompas */}
                  <div className="shp-compass-pivot" />
                </div>
              </div>

              <div className="shp-wind-telemetry-text">
                <div className="shp-wind-badge-row">
                  <span className="shp-wind-badge">
                    <Wind size={12} className="shp-wind-mini-icon" />
                    <span>Arah Angin Terkini</span>
                  </span>
                  <span className="shp-wind-speed-tag">
                    {selectedWeather.windSpeedKmh} km/jam (~{Math.round(selectedWeather.windSpeedKmh * 0.54)} knot)
                  </span>
                </div>

                <div className="shp-wind-direction-main">
                  <span className="shp-wind-dir-highlight">Menuju {blowTowardsCardinal}</span>
                  <span className="shp-wind-deg-pill">{blowTowardsDeg}° Azimuth</span>
                </div>

                <p className="shp-wind-desc-text">
                  Angin berhembus dari <b>{selectedWeather.windDirectionCardinal} ({selectedWeather.windDirectionDegree}°)</b> mendorong potensi persebaran api &amp; kabut asap ke arah <b>{blowTowardsCardinal}</b>.
                </p>
              </div>
            </div>
          )}

          {/* ─── Rekomendasi Taktis Pemadaman & Sekat Basah (Soil Wetting Boundary) ─── */}
          {selectedWeather && (
            <div className="shp-tactical-strategy-card" role="region" aria-label="Rekomendasi Pemadaman & Pembasahan Lahan">
              <div className="shp-tactical-header">
                <div className="shp-tactical-title-box">
                  <span className="shp-tactical-icon" aria-hidden="true">🛡️</span>
                  <div>
                    <h4 className="shp-tactical-title">Strategi Pemadaman &amp; Sekat Basah</h4>
                    <p className="shp-tactical-subtitle">
                      Penetapan batas sekat basah <i>(firebreak / soil wetting boundary)</i> agar api tidak menjalar
                    </p>
                  </div>
                </div>
                <div className="shp-tactical-distance-badge">
                  <span className="shp-tactical-badge-label">Jarak Batas Sekat</span>
                  <strong className="shp-tactical-badge-value">~{wettingDistKm.toFixed(1)} km ({wettingDistMeters} m)</strong>
                  <span className="shp-tactical-badge-sub">sektor tiupan {blowTowardsCardinal}</span>
                </div>
              </div>

              {/* Ringkasan Parameter Lapangan */}
              <div className="shp-tactical-metrics-row">
                <div className="shp-tactical-metric">
                  <span className="shp-tm-label">⚠️ Radius Bahaya Panas &amp; Asap</span>
                  <strong className="shp-tm-val">~{radiusKm.toFixed(1)} km</strong>
                  <span className="shp-tm-sub">Zona bahaya langsung api &amp; asap</span>
                </div>
                <div className="shp-tactical-metric">
                  <span className="shp-tm-label">💧 Lebar Pita Pembasahan</span>
                  <strong className="shp-tm-val">300 – 400 meter</strong>
                  <span className="shp-tm-sub">Pita pelembapan tanah gambut</span>
                </div>
                <div className="shp-tactical-metric">
                  <span className="shp-tm-label">🧭 Arah Perambatan Api</span>
                  <strong className="shp-tm-val">Menuju {blowTowardsCardinal} ({blowTowardsDeg}°)</strong>
                  <span className="shp-tm-sub">Dorongan angin {selectedWeather.windSpeedKmh} km/j</span>
                </div>
              </div>

              {/* Panduan Aksi: Petugas Lapangan vs Masyarakat Awam */}
              <div className="shp-tactical-action-grid">
                {/* Kolom 1: Untuk Petugas Lapangan */}
                <div className="shp-tactical-action-col shp-tactical-action-col--team">
                  <div className="shp-tac-col-header">
                    <ShieldCheck size={16} className="text-emerald" />
                    <span className="shp-tac-role-title">Panduan Petugas Lapangan &amp; Manggala Agni</span>
                  </div>
                  <ul className="shp-tac-list">
                    <li>
                      <strong>Buat Garis Sekat Basah:</strong> Basahi tanah/gambut di jarak <b>~{wettingDistKm.toFixed(1)} km</b> arah {blowTowardsCardinal} sebelum kepala api mencapai vegetasi kering.
                    </li>
                    <li>
                      <strong>Injeksi Gambut (Peat Soaking):</strong> Lakukan penyemprotan nozzle tancap ke dalam lapisan gambut untuk memutus penjalaran api bawah tanah <i>(smoldering fire)</i>.
                    </li>
                    <li>
                      <strong>Prioritas Water Bombing:</strong> Helikopter pemadam diarahkan menyiram pita hijau di peta untuk menahan laju lidah api utama.
                    </li>
                  </ul>
                </div>

                {/* Kolom 2: Untuk Warga Awam */}
                <div className="shp-tactical-action-col shp-tactical-action-col--public">
                  <div className="shp-tac-col-header">
                    <Users size={16} className="text-amber" />
                    <span className="shp-tac-role-title">Panduan Warga Sekitar &amp; Masyarakat Awam</span>
                  </div>
                  <ul className="shp-tac-list">
                    <li>
                      <strong>Zona Bahaya:</strong> Jangan mendekat ke dalam radius panas <b>~{radiusKm.toFixed(1)} km</b> dari titik api demi keselamatan.
                    </li>
                    <li>
                      <strong>Kesiapsiagaan Pemukiman:</strong> Warga di sektor {blowTowardsCardinal} dihimbau membasahi pekarangan, semak kering, dan atap rumah dengan air sumur/pompa.
                    </li>
                    <li>
                      <strong>Perlindungan Napas:</strong> Gunakan masker standar (N95/KN95) karena hembusan angin membawa konsentrasi asap tebal ke arah {blowTowardsCardinal}.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Banner Peringatan Potensi Perambatan Api (Live Open-Meteo) */}
          {selectedWeather && (
            <div className="shp-alert-banner">
              <div className="shp-alert-icon">
                <ShieldAlert size={16} />
              </div>
              <div className="shp-alert-content">
                <span className="shp-alert-title">
                  Peringatan Jalur Asap: <b>Sektor {blowTowardsCardinal}</b>
                </span>
                <p className="shp-alert-desc">
                  {selectedWeather.windSpeedKmh >= 15
                    ? `⚠️ Angin cukup kencang (${selectedWeather.windSpeedKmh} km/j). Satgas karhutla disarankan memprioritaskan sekat bakar di sektor ${blowTowardsCardinal}.`
                    : `ℹ️ Kecepatan angin relatif bersahabat (${selectedWeather.windSpeedKmh} km/j). Pantau konsentrasi kabut asap permukaan secara teratur.`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Tabel Data dengan Layout Kolom Terstruktur Bebas Tumpang Tindih ─── */}
      <div className={`table-scroll-container ${isExpanded ? 'table-scroll-container--expanded' : ''}`}>
        {filtered.length === 0 ? (
          <div className="table-empty" role="status">
            <span className="table-empty-icon" aria-hidden="true">🔍</span>
            <p>Tidak ada titik api ditemukan untuk filter ini.</p>
          </div>
        ) : (
          <table className="hotspot-table" role="grid" aria-label="Daftar titik api aktif">
            <thead>
              <tr>
                <th scope="col" style={{ width: '105px' }}><Clock size={12} aria-hidden="true" /> Waktu</th>
                <th scope="col" style={{ minWidth: '190px' }}><MapPin size={12} aria-hidden="true" /> Lokasi</th>
                <th scope="col" style={{ width: '150px' }}>Provinsi</th>
                <th scope="col" style={{ width: '140px' }}><Satellite size={12} aria-hidden="true" /> Satelit</th>
                <th scope="col" style={{ width: '120px' }}>Daya (FRP)</th>
                <th scope="col" style={{ width: '100px' }}>Conf.</th>
                <th scope="col" style={{ width: '140px' }}>Koordinat</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHotspots.map((hotspot) => {
                const badge = CONFIDENCE_BADGE[hotspot.confidence] || CONFIDENCE_BADGE.LOW;
                const isSelected = hotspot.id === selectedId;
                return (
                  <tr
                    key={hotspot.id}
                    ref={isSelected ? selectedRowRef : null}
                    className={`hotspot-row ${isSelected ? 'hotspot-row--selected' : ''}`}
                    onClick={() => onRowClick(hotspot)}
                    role="row"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onRowClick(hotspot)}
                  >
                    <td className="col-time">
                      <span className="time-primary">{formatTime(hotspot.detectedAt)}</span>
                      <span className="time-date">{formatDate(hotspot.detectedAt)}</span>
                    </td>
                    <td className="col-location">
                      <span className="location-name">{hotspot.locationName}</span>
                      {hotspot.regency && (
                        <span className="location-regency">{hotspot.regency}</span>
                      )}
                    </td>
                    <td className="col-province">
                      <span className="province-text">{hotspot.province}</span>
                    </td>
                    <td className="col-satellite">
                      <span className="satellite-badge">{hotspot.satellite}</span>
                    </td>
                    <td className="col-frp">
                      <span style={{ fontWeight: 700, color: (hotspot.maxFrp ?? 0) > 100 ? '#ef4444' : '#f97316' }}>
                        {hotspot.maxFrp ? `${hotspot.maxFrp.toFixed(1)} MW` : '-'}
                      </span>
                      {hotspot.count && hotspot.count > 1 ? (
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>
                          {hotspot.count} titik sensor
                        </span>
                      ) : null}
                    </td>
                    <td className="col-confidence">
                      <span className={badge.className} aria-label={`Confidence: ${badge.label}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="col-coords">
                      <span className="coords-text">
                        {hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Kontrol Navigasi Halaman / Paginasi ─── */}
      {filtered.length > 0 && (
        <div className="table-pagination-bar" role="navigation" aria-label="Navigasi halaman tabel">
          <span className="pagination-info">
            Menampilkan <b>{startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}</b> dari{' '}
            <b>{filtered.length.toLocaleString('id-ID')}</b> titik api
          </span>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage <= 1}
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft size={14} />
                <span>Sebelumnya</span>
              </button>

              <span className="pagination-page-indicator">
                Hal. <b>{validCurrentPage}</b> / {totalPages}
              </span>

              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage >= totalPages}
                aria-label="Halaman berikutnya"
              >
                <span>Berikutnya</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
