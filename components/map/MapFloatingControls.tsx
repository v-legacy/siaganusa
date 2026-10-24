/**
 * @file components/map/MapFloatingControls.tsx
 * @description Floating Action Controls di atas peta, meniru ergonomi Google Maps.
 * Menyediakan: Indikator jumlah hotspot, toggle layer arah angin darat & laut, reset zoom ke Indonesia, dan refresh data.
 * Dilengkapi dengan tactile feedback, animasi micro-motion icon, status toast pill, dan proteksi anti-double action (debounce).
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, Navigation, Wind, Waves, HelpCircle } from 'lucide-react';

interface MapFloatingControlsProps {
  totalHotspots: number;
  isLoading: boolean;
  isWindLayerActive: boolean;
  isSeaWindLayerActive?: boolean;
  onRefresh: () => void;
  onResetView: () => void;
  onToggleWindLayer: () => void;
  onToggleSeaWindLayer?: () => void;
  onOpenTour?: () => void;
}

type ToastType = 'wind-on' | 'wind-off' | 'sea-on' | 'sea-off' | 'reset' | 'refresh';

interface ToastState {
  message: string;
  icon: string;
  type: ToastType;
}

export default function MapFloatingControls({
  totalHotspots,
  isLoading,
  isWindLayerActive,
  isSeaWindLayerActive = false,
  onRefresh,
  onResetView,
  onToggleWindLayer,
  onToggleSeaWindLayer,
  onOpenTour,
}: MapFloatingControlsProps) {
  // State untuk animasi micro-motion icon
  const [animatingIcon, setAnimatingIcon] = useState<'wind' | 'sea' | 'compass' | null>(null);

  // State untuk ripple wave effect pada tombol yang baru saja diklik
  const [rippleBtn, setRippleBtn] = useState<'wind' | 'sea' | 'reset' | 'refresh' | null>(null);

  // State untuk toast konfirmasi visual seketika
  const [toast, setToast] = useState<ToastState | null>(null);

  // Guard ref untuk mencegah double-tap / double-action
  const lastActionRef = useRef<{ [key: string]: number }>({});
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper haptic vibration pada browser mobile yang mendukung
  const triggerHaptic = (duration = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        // Abaikan jika tidak didukung oleh browser/OS
      }
    }
  };

  // Helper menampilkan feedback toast yang auto-dismiss
  const showToast = useCallback((message: string, icon: string, type: ToastType) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, icon, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 1800);
  }, []);

  // Cleanup timeout saat unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Handler Toggle Angin Darat dengan anti-double tap
  const handleToggleWind = () => {
    const now = Date.now();
    if (now - (lastActionRef.current['wind'] || 0) < 400) return;
    lastActionRef.current['wind'] = now;

    triggerHaptic(18);
    setRippleBtn('wind');
    setAnimatingIcon('wind');
    setTimeout(() => setRippleBtn(null), 400);
    setTimeout(() => setAnimatingIcon(null), 450);

    const willBeActive = !isWindLayerActive;
    showToast(
      willBeActive ? 'Angin Darat: AKTIF' : 'Angin Darat: NONAKTIF',
      '💨',
      willBeActive ? 'wind-on' : 'wind-off'
    );

    onToggleWindLayer();
  };

  // Handler Toggle Angin Laut dengan anti-double tap
  const handleToggleSeaWind = () => {
    if (!onToggleSeaWindLayer) return;
    const now = Date.now();
    if (now - (lastActionRef.current['sea'] || 0) < 400) return;
    lastActionRef.current['sea'] = now;

    triggerHaptic(18);
    setRippleBtn('sea');
    setAnimatingIcon('sea');
    setTimeout(() => setRippleBtn(null), 400);
    setTimeout(() => setAnimatingIcon(null), 450);

    const willBeActive = !isSeaWindLayerActive;
    showToast(
      willBeActive ? 'Angin Laut: AKTIF' : 'Angin Laut: NONAKTIF',
      '🌊',
      willBeActive ? 'sea-on' : 'sea-off'
    );

    onToggleSeaWindLayer();
  };

  // Handler Reset View dengan anti-double tap & compass spin
  const handleResetView = () => {
    const now = Date.now();
    if (now - (lastActionRef.current['reset'] || 0) < 500) return;
    lastActionRef.current['reset'] = now;

    triggerHaptic(15);
    setRippleBtn('reset');
    setAnimatingIcon('compass');
    setTimeout(() => setRippleBtn(null), 400);
    setTimeout(() => setAnimatingIcon(null), 600);

    showToast('Posisi Peta Direset', '🧭', 'reset');
    onResetView();
  };

  // Handler Refresh Data dengan anti-double tap
  const handleRefresh = () => {
    if (isLoading) return;
    const now = Date.now();
    if (now - (lastActionRef.current['refresh'] || 0) < 800) return;
    lastActionRef.current['refresh'] = now;

    triggerHaptic(20);
    setRippleBtn('refresh');
    setTimeout(() => setRippleBtn(null), 400);

    showToast('Memperbarui Data Titik Api...', '🔄', 'refresh');
    onRefresh();
  };

  return (
    <div className="map-floating-controls" role="toolbar" aria-label="Kontrol peta">
      {/* Badge jumlah hotspot aktif */}
      <div className="floating-hotspot-badge" aria-live="polite">
        <span className="hotspot-badge-dot" aria-hidden="true" />
        <span className="hotspot-badge-count">
          {isLoading ? '...' : totalHotspots.toLocaleString('id-ID')}
        </span>
        <span className="hotspot-badge-label">Titik Api</span>
      </div>

      {/* Floating Action Confirmation Toast (Feedback Instan ke Pengguna) */}
      {toast && (
        <div
          className={`floating-action-toast floating-action-toast--${toast.type}`}
          role="status"
          aria-live="assertive"
        >
          <span className="floating-action-toast-icon" aria-hidden="true">{toast.icon}</span>
          <span className="floating-action-toast-text">{toast.message}</span>
        </div>
      )}

      {/* Grup Tombol Aksi Kontrol (Target Presisi Spotlight Tour Step 1) */}
      <div id="map-controls-actions-group" className="floating-actions-group">
        {/* Tombol Toggle Layer Arah Angin Darat / Titik Api */}
        <button
          id="btn-toggle-land-wind"
          type="button"
          className={`floating-btn ${
            isWindLayerActive ? 'floating-btn--active-wind' : 'floating-btn--inactive'
          } ${rippleBtn === 'wind' ? 'floating-btn--pressed' : ''}`}
          onClick={handleToggleWind}
          title={isWindLayerActive ? 'Matikan Layer Angin Darat & Titik Api' : 'Aktifkan Layer Angin Darat & Titik Api'}
          aria-label="Toggle layer arah angin darat"
          aria-pressed={isWindLayerActive}
        >
          {rippleBtn === 'wind' && <span className="floating-btn-ripple" aria-hidden="true" />}
          <Wind
            size={18}
            className={`floating-btn-icon ${animatingIcon === 'wind' ? 'icon-gusting-wind' : ''}`}
          />
          <span
            className={`floating-btn-status-badge ${
              isWindLayerActive ? 'floating-btn-status-badge--on' : 'floating-btn-status-badge--off'
            }`}
            aria-hidden="true"
          >
            {isWindLayerActive ? 'ON' : 'OFF'}
          </span>
          {isWindLayerActive && <span className="floating-btn-indicator" aria-hidden="true" />}
        </button>

        {/* Tombol Toggle Layer Arah Angin Laut Maritim Terpisah */}
        {onToggleSeaWindLayer && (
          <button
            id="btn-toggle-sea-wind"
            type="button"
            className={`floating-btn ${
              isSeaWindLayerActive ? 'floating-btn--active-sea' : 'floating-btn--inactive'
            } ${rippleBtn === 'sea' ? 'floating-btn--pressed' : ''}`}
            onClick={handleToggleSeaWind}
            title={isSeaWindLayerActive ? 'Matikan Layer Angin Laut Maritim' : 'Aktifkan Layer Angin Laut Maritim'}
            aria-label="Toggle layer arah angin laut maritim"
            aria-pressed={isSeaWindLayerActive}
          >
            {rippleBtn === 'sea' && <span className="floating-btn-ripple" aria-hidden="true" />}
            <Waves
              size={18}
              className={`floating-btn-icon ${animatingIcon === 'sea' ? 'icon-swelling-wave' : ''}`}
            />
            <span
              className={`floating-btn-status-badge ${
                isSeaWindLayerActive ? 'floating-btn-status-badge--on-sea' : 'floating-btn-status-badge--off'
              }`}
              aria-hidden="true"
            >
              {isSeaWindLayerActive ? 'ON' : 'OFF'}
            </span>
            {isSeaWindLayerActive && <span className="floating-btn-indicator floating-btn-indicator--cyan" aria-hidden="true" />}
          </button>
        )}

        {/* Tombol Reset View ke Indonesia */}
        <button
          id="btn-reset-view"
          type="button"
          className={`floating-btn ${rippleBtn === 'reset' ? 'floating-btn--pressed' : ''}`}
          onClick={handleResetView}
          title="Tampilkan seluruh Indonesia"
          aria-label="Reset tampilan peta ke Indonesia"
        >
          {rippleBtn === 'reset' && <span className="floating-btn-ripple" aria-hidden="true" />}
          <Navigation
            size={18}
            className={`floating-btn-icon ${animatingIcon === 'compass' ? 'icon-spinning-compass' : ''}`}
          />
        </button>

        {/* Tombol Refresh data */}
        <button
          id="btn-refresh-data"
          type="button"
          className={`floating-btn ${isLoading ? 'floating-btn--loading' : ''} ${
            rippleBtn === 'refresh' ? 'floating-btn--pressed' : ''
          }`}
          onClick={handleRefresh}
          disabled={isLoading}
          title="Perbarui data titik api"
          aria-label="Perbarui data titik api"
        >
          {rippleBtn === 'refresh' && <span className="floating-btn-ripple" aria-hidden="true" />}
          <RefreshCw size={18} className={`floating-btn-icon ${isLoading ? 'spin' : ''}`} />
        </button>

        {/* Tombol Buka Panduan Fitur (Coach Mark) */}
        {onOpenTour && (
          <button
            id="btn-open-coachmark"
            type="button"
            className="floating-btn floating-btn--tour"
            onClick={onOpenTour}
            title="Buka Panduan Fitur (Coach Mark)"
            aria-label="Buka Panduan Fitur"
          >
            <HelpCircle size={18} className="floating-btn-icon" />
          </button>
        )}
      </div>
    </div>
  );
}
