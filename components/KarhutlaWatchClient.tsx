/**
 * @file components/KarhutlaWatchClient.tsx
 * @description Komponen Client utama yang merakit semua bagian Karhutla Watch.
 * Mengelola state: selectedHotspot, selectedWeather, isWindLayerActive, theme, dan koordinasi antar komponen.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import DisasterMap from '@/components/map/DisasterMap';
import MapFloatingControls from '@/components/map/MapFloatingControls';
import { useDisasterData } from '@/hooks/useDisasterData';
import { useTheme } from '@/hooks/useTheme';
import type { DisasterHotspot } from '@/types/disaster';
import type { LocationWeather, RegionalZone } from '@/types/weather';
import type { AirQualityData } from '@/types/airQuality';

// ─── Code-splitting ──────────────────────────────────────────────────────────
// Tabel rincian berada di bawah fold: tetap di-SSR (HTML langsung tersedia, tanpa
// layout shift), namun JS-nya dipisah ke chunk tersendiri agar tidak membebani
// bundle awal yang dibutuhkan peta.
const DisasterTable = dynamic(() => import('@/components/disaster/DisasterTable'));

// Overlay interaktif hanya dibutuhkan setelah interaksi pengguna → muat on-demand
// di klien saja (keduanya memakai portal/DOM API dan tidak terlihat saat SSR).
const CoachMarkTour = dynamic(() => import('@/components/tutorial/CoachMarkTour'), {
  ssr: false,
});
const DonationModal = dynamic(() => import('@/components/donation/DonationModal'), {
  ssr: false,
});

export default function KarhutlaWatchClient() {
  const { hotspots, summary, isLoading, error, fetchedAt, refresh } = useDisasterData();
  const { theme, toggleTheme, isDark } = useTheme();

  // State titik api terpilih
  const [selectedHotspot, setSelectedHotspot] = useState<DisasterHotspot | null>(null);

  // State layer arah angin darat (default: nonaktif)
  const [isWindLayerActive, setIsWindLayerActive] = useState<boolean>(false);

  // State layer arah angin laut maritim terpisah (default: nonaktif)
  const [isSeaWindLayerActive, setIsSeaWindLayerActive] = useState<boolean>(false);

  // State panduan fitur interaktif (Coach Mark Tour)
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // State modal donasi / support Saweria
  const [isDonationOpen, setIsDonationOpen] = useState<boolean>(false);

  // State data cuaca & arah angin Open-Meteo untuk hotspot terpilih
  const [selectedWeather, setSelectedWeather] = useState<LocationWeather | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);

  // State data kualitas udara & ISPU (Open-Meteo Air Quality) untuk hotspot terpilih
  const [selectedAirQuality, setSelectedAirQuality] = useState<AirQualityData | null>(null);
  const [isLoadingAirQuality, setIsLoadingAirQuality] = useState<boolean>(false);

  // State data pola angin regional se-Indonesia (14 zona Open-Meteo)
  const [regionalWeather, setRegionalWeather] = useState<RegionalZone[]>([]);

  // Ref untuk reset tampilan peta
  const mapResetRef = useRef<(() => void) | null>(null);

  // Catat analitik kunjungan pengunjung saat main thread idle (tidak memblokir TBT / LCP)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sendAnalytics = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const utmSource = params.get('utm_source') || params.get('source') || undefined;
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: window.location.pathname,
            referrer: document.referrer || '',
            utmSource,
          }),
        }).catch(() => {});
      } catch {
        // ignore
      }
    };

    if ('requestIdleCallback' in window) {
      const id = (window as unknown as { requestIdleCallback: (cb: () => void, opts: { timeout: number }) => number })
        .requestIdleCallback(sendAnalytics, { timeout: 4000 });
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
        }
      };
    } else {
      const timer = setTimeout(sendAnalytics, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Ambil pola cuaca & angin regional se-Indonesia secara asinkron setelah initial load
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      fetch('/api/weather/regional')
        .then((res) => res.json())
        .then((json) => {
          if (active && json.success && Array.isArray(json.data)) {
            setRegionalWeather(json.data);
          }
        })
        .catch((err) => {
          console.warn('Gagal memuat pola angin regional:', err);
        });
    }, 1200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  // Ambil cuaca live & kualitas udara/ISPU saat hotspot dipilih
  useEffect(() => {
    if (!selectedHotspot) return;

    let active = true;

    // Fetch Cuaca & Angin Live
    fetch(`/api/weather?lat=${selectedHotspot.latitude}&lng=${selectedHotspot.longitude}`)
      .then((res) => res.json())
      .then((json) => {
        if (active && json.success && json.data) {
          setSelectedWeather(json.data);
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat cuaca untuk hotspot:', err);
      })
      .finally(() => {
        if (active) setIsLoadingWeather(false);
      });

    // Fetch Kualitas Udara & Konsentrasi Asap (ISPU)
    fetch(`/api/air-quality?lat=${selectedHotspot.latitude}&lng=${selectedHotspot.longitude}`)
      .then((res) => res.json())
      .then((json) => {
        if (active && json.success && json.data) {
          setSelectedAirQuality(json.data);
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat kualitas udara untuk hotspot:', err);
      })
      .finally(() => {
        if (active) setIsLoadingAirQuality(false);
      });

    return () => {
      active = false;
    };
  }, [selectedHotspot]);

  const handleHotspotClick = useCallback((hotspot: DisasterHotspot) => {
    // Jika ID kosong, deselect
    if (!hotspot.id) {
      setSelectedHotspot(null);
      setSelectedWeather(null);
      setSelectedAirQuality(null);
      return;
    }

    setSelectedHotspot(hotspot);
    setIsLoadingWeather(true);
    setIsLoadingAirQuality(true);

    // Di mobile, scroll halus ke panel rincian di dekat tabel
    if (window.innerWidth < 768) {
      document.getElementById('disaster-table-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, []);

  // Otomatis pilih & sorot titik api jika link dibuka dari tautan WhatsApp (?hotspot= atau ?lat=&lng=)
  useEffect(() => {
    if (typeof window === 'undefined' || hotspots.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('hotspot');
    const targetLat = parseFloat(params.get('lat') || '');
    const targetLng = parseFloat(params.get('lng') || '');

    if (targetId) {
      const match = hotspots.find((h) => h.id === targetId);
      if (match) {
        handleHotspotClick(match);
        return;
      }
    }

    if (!isNaN(targetLat) && !isNaN(targetLng)) {
      const closest = hotspots.find(
        (h) => Math.abs(h.latitude - targetLat) < 0.05 && Math.abs(h.longitude - targetLng) < 0.05
      );
      if (closest) {
        handleHotspotClick(closest);
      }
    }
  }, [hotspots, handleHotspotClick]);

  const handleResetView = useCallback(() => {
    if (mapResetRef.current) mapResetRef.current();
    setSelectedHotspot(null);
    setSelectedWeather(null);
    setSelectedAirQuality(null);
  }, []);

  const handleToggleWindLayer = useCallback(() => {
    setIsWindLayerActive((prev) => !prev);
  }, []);

  const handleToggleSeaWindLayer = useCallback(() => {
    setIsSeaWindLayerActive((prev) => !prev);
  }, []);

  const handleOpenTour = useCallback(() => {
    setIsTourOpen(true);
  }, []);

  const handleCloseTour = useCallback(() => {
    setIsTourOpen(false);
  }, []);

  const handleOpenDonation = useCallback(() => {
    setIsDonationOpen(true);
  }, []);

  const handleCloseDonation = useCallback(() => {
    setIsDonationOpen(false);
  }, []);

  return (
    <div className="app-shell" data-theme={theme}>
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        summary={summary}
        isLoading={isLoading}
        fetchedAt={fetchedAt}
        onOpenTour={handleOpenTour}
        onOpenDonation={handleOpenDonation}
      />

      {/* ─── Area peta + kontrol mengambang ─────────────────────────────── */}
      <main className="map-section" role="main" aria-label="Peta pemantauan kebakaran hutan">
        {/* Error state */}
        {error && (
          <div className="error-banner" role="alert">
            <span>⚠️ {error}</span>
            <button onClick={refresh} className="error-retry-btn">Coba Lagi</button>
          </div>
        )}

        {/* Floating Controls di atas peta */}
        <div className="map-floating-controls-wrapper">
          <MapFloatingControls
            totalHotspots={summary?.total ?? 0}
            isLoading={isLoading}
            isWindLayerActive={isWindLayerActive}
            isSeaWindLayerActive={isSeaWindLayerActive}
            onRefresh={refresh}
            onResetView={handleResetView}
            onToggleWindLayer={handleToggleWindLayer}
            onToggleSeaWindLayer={handleToggleSeaWindLayer}
            onOpenTour={handleOpenTour}
          />
        </div>

        {/* Peta utama */}
        <div className="map-container" id="tour-map-container">
          <DisasterMap
            hotspots={hotspots}
            isDark={isDark}
            onHotspotClick={handleHotspotClick}
            selectedHotspotId={selectedHotspot?.id ?? null}
            isWindLayerActive={isWindLayerActive}
            isSeaWindLayerActive={isSeaWindLayerActive}
            selectedWeather={selectedWeather}
            isLoadingWeather={isLoadingWeather}
            selectedAirQuality={selectedAirQuality}
            isLoadingAirQuality={isLoadingAirQuality}
            regionalWeather={regionalWeather}
          />
        </div>

        {/* Legend peta */}
        <div className="map-legend" aria-label="Keterangan simbol peta">
          <span className="legend-item" title="Tingkat Keyakinan Hotspot Satelit">
            <span className="legend-dot legend-dot--high" aria-hidden="true" />
            <span>Api Tinggi</span>
          </span>
          <span className="legend-item" title="Tingkat Keyakinan Hotspot Satelit">
            <span className="legend-dot legend-dot--medium" aria-hidden="true" />
            <span>Api Sedang</span>
          </span>
          <span className="legend-item" title="Tingkat Keyakinan Hotspot Satelit">
            <span className="legend-dot legend-dot--low" aria-hidden="true" />
            <span>Api Rendah</span>
          </span>
          <span className="legend-item" title="Jejak fisik cakupan lahan yang terbakar terdeteksi satelit">
            <span className="legend-bbox-box" aria-hidden="true" />
            <span>Lahan Terbakar</span>
          </span>
          <span className="legend-item" title="Zona bahaya paparan radiasi termal langsung dan kabut asap pekat">
            <span className="legend-halo-circle" aria-hidden="true" />
            <span>Bahaya Panas &amp; Asap</span>
          </span>
          <span className="legend-item legend-item--firebreak" title="Garis batas sekat basah dan pelembapan tanah pencegah rembetan">
            <span className="legend-firebreak-line" aria-hidden="true" />
            <span>Sekat Basah</span>
          </span>
          {isWindLayerActive && (
            <span className="legend-item legend-item--wind">
              <span className="legend-wind-icon">💨</span>
              <span>Angin Darat</span>
            </span>
          )}
          {isSeaWindLayerActive && (
            <span className="legend-item legend-item--wind" style={{ color: '#0284c7' }}>
              <span className="legend-wind-icon">🌊</span>
              <span>Angin Laut</span>
            </span>
          )}
          <span className="legend-source" aria-label="Sumber data">
            Sumber: KANARI / Satelit VIIRS &amp; MODIS
          </span>
        </div>
      </main>

      {/* ─── Tabel detail & panel rincian bawah peta ─────────────────────── */}
      <div id="disaster-table-section">
        <DisasterTable
          hotspots={hotspots}
          selectedId={selectedHotspot?.id ?? null}
          selectedHotspot={selectedHotspot}
          selectedWeather={selectedWeather}
          isLoadingWeather={isLoadingWeather}
          selectedAirQuality={selectedAirQuality}
          isLoadingAirQuality={isLoadingAirQuality}
          onRowClick={handleHotspotClick}
        />
      </div>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="site-footer" role="contentinfo">
        <p className="footer-text">
          Data titik api bersumber dari{' '}
          <a href="https://kanari.io" target="_blank" rel="noopener noreferrer" className="footer-link">
            kanari.io
          </a>{' '}
          · Cuaca{' '}
          <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="footer-link">
            Open-Meteo
          </a>{' '}
          · Peta{' '}
          <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="footer-link">
            OpenStreetMap
          </a>{' '}
          ·{' '}
          <button
            onClick={handleOpenDonation}
            className="footer-link footer-link--support"
            title="Dukung pemeliharaan aplikasi via Saweria"
          >
            ☕ Dukung Aplikasi
          </button>
        </p>
        <p className="footer-copyright">
          &copy; 2026 SiagaNusa by <strong>levy-studios</strong> · Dibuat untuk Indonesia 🇮🇩
        </p>
      </footer>

      {/* ─── Interactive Coach Mark / Feature Walkthrough ──────────────── */}
      {/* Di-mount hanya saat dibuka agar chunk-nya tidak diunduh sebelum dibutuhkan */}
      {isTourOpen && (
        <CoachMarkTour
          isOpen={isTourOpen}
          onClose={handleCloseTour}
          onComplete={handleCloseTour}
        />
      )}

      {/* ─── Modal Donasi Saweria ───────────────────────────────────────── */}
      {isDonationOpen && (
        <DonationModal
          isOpen={isDonationOpen}
          onClose={handleCloseDonation}
        />
      )}
    </div>
  );
}
