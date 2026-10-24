/**
 * @file components/tutorial/CoachMarkTour.tsx
 * @description Komponen Interactive Coach Mark & Feature Walkthrough premium untuk SiagaNusa.
 *
 * Fitur Utama & Keunggulan UX:
 * 1. Spotlight Cutout Mask Dinamis dengan transisi mulus dan animated glowing ring.
 * 2. Smart Positioning dengan panah pointer adaptif (atas, bawah, kiri, kanan) dan mobile bottom-sheet.
 * 3. Mini-card visual interaktif untuk setiap langkah (menjelaskan tombol toggle angin darat & laut, kluster titik api, dan WhatsApp dispatch).
 * 4. Navigasi kaya: Lewati (Skip), Sebelumnya, Lanjut, dan Selesai dengan indikator progress pill bar.
 * 5. Checkbox "Jangan tampilkan lagi" yang tersimpan persisten di localStorage.
 * 6. Dukungan aksesibilitas lengkap (ARIA dialog, keyboard navigation Esc, ArrowRight, ArrowLeft).
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';

import { COACHMARK_STORAGE_KEY } from '@/constants/coachmark';

export { COACHMARK_STORAGE_KEY };

export interface CoachMarkStep {
  id: string;
  targetSelector: string;
  badge: string;
  title: string;
  subtitle: string;
  positionPreference?: 'left' | 'right' | 'top' | 'bottom';
  chips: {
    icon: string;
    title: string;
    tag?: string;
    tagType?: 'badge-off' | 'badge-on' | 'badge-hot' | 'badge-green' | 'badge-blue';
    desc: string;
  }[];
  proTip?: string;
}

const TOUR_STEPS: CoachMarkStep[] = [
  {
    id: 'floating-controls',
    targetSelector: '#map-controls-actions-group',
    badge: 'LANGKAH 1 DARI 3 · KONTROL PETA',
    title: 'Kontrol Lapisan Cuaca & Navigasi Peta',
    subtitle: 'Atur visualisasi arah angin, pola maritim, dan telemetri satelit secara fleksibel.',
    positionPreference: 'left',
    chips: [
      {
        icon: '💨',
        title: 'Toggle Angin Darat',
        tag: 'DEFAULT NONAKTIF',
        tagType: 'badge-off',
        desc: 'Menampilkan aliran arah angin lokal (Open-Meteo) & proyeksi perambatan api. Klik toggle untuk mengaktifkan bila diperlukan.',
      },
      {
        icon: '🌊',
        title: 'Toggle Angin Laut Maritim',
        tag: 'DEFAULT NONAKTIF',
        tagType: 'badge-off',
        desc: 'Memvisualisasikan sirkulasi angin maritim kepulauan (Selat Malaka, Laut Jawa, Selat Makassar).',
      },
      {
        icon: '🧭',
        title: 'Pusatkan Peta (Reset View)',
        tag: 'NAVIGASI CEPAT',
        tagType: 'badge-blue',
        desc: 'Mereset zoom dan memposisikan ulang kamera ke seluruh batas wilayah kepulauan Indonesia.',
      },
      {
        icon: '🔄',
        title: 'Perbarui Data Titik Api',
        tag: 'DATA SATELIT LIVE',
        tagType: 'badge-hot',
        desc: 'Sinkronisasi ulang telemetri anomali termal satelit NASA VIIRS/MODIS & Kanari secara real-time.',
      },
    ],
    proTip: '💡 Kedua layer angin sengaja dimatikan default agar peta tampil bersih, ringan, dan cepat saat dibuka pertama kali.',
  },
  {
    id: 'map-hotspots-and-firebreak',
    targetSelector: '#tour-map-container',
    badge: 'LANGKAH 2 DARI 3 · TITIK API & SEKAT BASAH',
    title: 'Kluster Titik Api & Sekat Basah Taktis',
    subtitle: 'Deteksi dini anomali termal vegetasi dan panduan strategi pemadaman api di lapangan.',
    positionPreference: 'bottom',
    chips: [
      {
        icon: '🔴',
        title: 'Tingkat Keyakinan (Confidence)',
        tag: 'TINGGI · SEDANG · RENDAH',
        tagType: 'badge-hot',
        desc: 'Warna marker merah (High), oranye (Medium), dan kuning (Low) merefleksikan kekuatan radiasi termal satelit.',
      },
      {
        icon: '🎯',
        title: 'Fokus & Telemetri Dampak',
        tag: 'INTERAKSI KLIK',
        tagType: 'badge-blue',
        desc: 'Klik titik api mana pun di peta untuk melihat daya panas (MW), radius radiasi asap, dan kualitas udara (ISPU).',
      },
      {
        icon: '🛡️',
        title: 'Sekat Basah Taktis (Manggala Agni)',
        tag: 'STRATEGI PEMADAMAN',
        tagType: 'badge-green',
        desc: 'Garis busur hijau otomatis digambar di depan arah angin sebagai zona prioritas pelembapan tanah untuk memutus api.',
      },
    ],
    proTip: '💡 Anda dapat langsung mengklik marker api di peta sekarang untuk melihat detail daya panas & vektor angin.',
  },
  {
    id: 'disaster-table-and-dispatch',
    targetSelector: '#disaster-table-section',
    badge: 'LANGKAH 3 DARI 3 · KOORDINASI DARURAT',
    title: 'Tabel Detail & Dispatch WhatsApp Cepat',
    subtitle: 'Kelola data hotspot terverifikasi dan teruskan peringatan resmi langsung ke satgas.',
    positionPreference: 'top',
    chips: [
      {
        icon: '🔍',
        title: 'Filter Wilayah & Sortir Daya Panas',
        tag: 'PENCARIAN PRESISI',
        tagType: 'badge-blue',
        desc: 'Saring titik api berdasarkan nama provinsi, tingkat risiko, atau urutkan titik dengan daya termal (FRP) tertinggi.',
      },
      {
        icon: '📲',
        title: 'Kirim WhatsApp Otomatis',
        tag: '1-KLIK DISPATCH',
        tagType: 'badge-green',
        desc: 'Buka WhatsApp Web/Desktop seketika dengan draft pesan darurat resmi (koordinat, FRP, masker N95, link Google Maps).',
      },
      {
        icon: '📋',
        title: 'Salin Telemetri ke Clipboard',
        tag: 'PELAPORAN CEPAT',
        tagType: 'badge-hot',
        desc: 'Salin data teknis lengkap hotspot dalam satu klik untuk dokumentasi satgas atau pelaporan instansi.',
      },
    ],
    proTip: '💡 Tombol "Kirim WA" pada setiap baris hotspot langsung menyiapkan pesan peringatan tanpa perlu mengetik manual.',
  },
];

interface CoachMarkTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function CoachMarkTour({ isOpen, onClose, onComplete }: CoachMarkTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [viewportDims, setViewportDims] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
  });
  const [cardPlacement, setCardPlacement] = useState<{
    top: number;
    left: number;
    arrowSide: 'top' | 'bottom' | 'left' | 'right' | 'none';
    arrowOffset: number;
  }>({
    top: 0,
    left: 0,
    arrowSide: 'none',
    arrowOffset: 0,
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const currentStep = TOUR_STEPS[currentStepIndex];

  // Hitung posisi spotlight dan card
  const updatePosition = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    setViewportDims({ width: viewportW, height: viewportH });

    let el: Element | null = document.querySelector(currentStep.targetSelector);
    // Fallback jika elemen target spesifik belum ready di DOM
    if (!el) {
      if (currentStep.id === 'floating-controls') {
        el = document.querySelector('.map-floating-controls');
      } else if (currentStep.id === 'map-hotspots-and-firebreak') {
        el = document.querySelector('.map-container') || document.querySelector('.map-section');
      } else if (currentStep.id === 'disaster-table-and-dispatch') {
        el = document.querySelector('.disaster-table-section');
      }
    }

    const isMobile = viewportW < 768;
    const cardW = isMobile ? viewportW - 24 : Math.min(480, viewportW - 40);
    const cardH = cardRef.current ? cardRef.current.offsetHeight : 420;

    if (!el) {
      setTargetRect(null);
      setCardPlacement({
        top: Math.max(16, (viewportH - cardH) / 2),
        left: Math.max(12, (viewportW - cardW) / 2),
        arrowSide: 'none',
        arrowOffset: 0,
      });
      return;
    }

    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    if (isMobile) {
      // Mobile: Docking rapi di bagian bawah layar seperti Bottom Sheet
      const bottomMargin = 14;
      setCardPlacement({
        top: Math.max(16, viewportH - cardH - bottomMargin),
        left: 12,
        arrowSide: 'none',
        arrowOffset: 0,
      });
      return;
    }

    // Step 2: Khusus target Map Container
    // Posisikan kartu di pojok kiri bawah peta (di atas legend)
    // agar tidak menghalangi titik api utama di tengah peta Indonesia
    if (currentStep.id === 'map-hotspots-and-firebreak') {
      const cardLeft = Math.max(20, rect.left + 24);
      const cardTop = Math.max(20, Math.min(rect.bottom - cardH - 24, viewportH - cardH - 20));
      setCardPlacement({
        top: cardTop,
        left: cardLeft,
        arrowSide: 'none',
        arrowOffset: 0,
      });
      return;
    }

    // Desktop: Hitung posisi relatif terhadap elemen yang disorot
    const pref = currentStep.positionPreference || 'bottom';
    let top = 0;
    let left = 0;
    let arrowSide: 'top' | 'bottom' | 'left' | 'right' | 'none' = 'none';
    let arrowOffset = 0;

    if (pref === 'left') {
      // Tempatkan kartu di sebelah kiri target (ideal untuk floating controls di kanan atas)
      left = rect.left - cardW - 20;
      top = Math.max(16, Math.min(rect.top - 8, viewportH - cardH - 16));
      arrowSide = 'right';
      arrowOffset = Math.max(24, Math.min(rect.top + rect.height / 2 - top, cardH - 24));

      // Jika ruang kiri kurang (layar sempit), balik ke bawah
      if (left < 16) {
        left = Math.max(16, Math.min(rect.left, viewportW - cardW - 16));
        top = Math.min(viewportH - cardH - 16, rect.bottom + 18);
        arrowSide = 'top';
        arrowOffset = Math.max(24, Math.min(rect.left + rect.width / 2 - left, cardW - 24));
      }
    } else if (pref === 'top') {
      // Tempatkan kartu di atas target (ideal untuk tabel)
      top = rect.top - cardH - 18;
      left = Math.max(16, Math.min(rect.left + rect.width / 2 - cardW / 2, viewportW - cardW - 16));
      arrowSide = 'bottom';
      arrowOffset = Math.max(24, Math.min(rect.left + rect.width / 2 - left, cardW - 24));

      // Jika ruang atas kurang (misal tabel mepet ke atas layar setelah scroll),
      // posisikan kartu mengambang di kanan atas tabel
      if (top < 16) {
        top = Math.max(16, rect.top + 16);
        left = Math.max(16, Math.min(viewportW - cardW - 28, rect.right - cardW - 16));
        arrowSide = 'none';
      }
    } else {
      // Default: tempatkan kartu di bawah target
      top = rect.bottom + 18;
      left = Math.max(16, Math.min(rect.left + rect.width / 2 - cardW / 2, viewportW - cardW - 16));
      arrowSide = 'top';
      arrowOffset = Math.max(24, Math.min(rect.left + rect.width / 2 - left, cardW - 24));

      // Jika ruang bawah kurang, balik ke atas
      if (top + cardH > viewportH - 16) {
        top = Math.max(16, rect.top - cardH - 18);
        arrowSide = 'bottom';
      }
    }

    setCardPlacement({
      top: Math.max(14, Math.min(top, viewportH - cardH - 14)),
      left: Math.max(14, Math.min(left, viewportW - cardW - 14)),
      arrowSide,
      arrowOffset,
    });
  }, [isOpen, currentStep]);

  // Scroll target ke pandangan & lacak posisi secara mulus
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    let el: Element | null = document.querySelector(currentStep.targetSelector);
    if (!el) {
      if (currentStep.id === 'floating-controls') {
        el = document.querySelector('.map-floating-controls');
      } else if (currentStep.id === 'map-hotspots-and-firebreak') {
        el = document.querySelector('.map-container') || document.querySelector('.map-section');
      } else if (currentStep.id === 'disaster-table-and-dispatch') {
        el = document.querySelector('.disaster-table-section');
      }
    }

    if (el) {
      if (currentStep.id === 'disaster-table-and-dispatch') {
        const headerOffset = 70;
        const elementTop = el.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: Math.max(0, elementTop - headerOffset), behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    // Dynamic Tracking Loop via RAF during smooth scroll (~750ms)
    let animationFrameId: number;
    const startTime = performance.now();
    const duration = 750;

    const track = (currentTime: number) => {
      updatePosition();
      if (currentTime - startTime < duration) {
        animationFrameId = requestAnimationFrame(track);
      } else {
        updatePosition(); // Final lock
      }
    };
    animationFrameId = requestAnimationFrame(track);

    const handleResizeOrScroll = () => updatePosition();
    window.addEventListener('resize', handleResizeOrScroll, { passive: true });
    window.addEventListener('scroll', handleResizeOrScroll, { passive: true, capture: true });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [isOpen, currentStepIndex, currentStep, updatePosition]);

  // Dismiss / Selesai
  const handleDismiss = useCallback(
    (completed = false) => {
      if (dontShowAgain && typeof window !== 'undefined') {
        try {
          localStorage.setItem(COACHMARK_STORAGE_KEY, 'true');
        } catch (err) {
          console.warn('Gagal menyimpan status coachmark ke localStorage:', err);
        }
      }
      if (completed && onComplete) {
        onComplete();
      } else {
        onClose();
      }
    },
    [dontShowAgain, onClose, onComplete]
  );

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleDismiss(true);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss(false);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStepIndex, dontShowAgain]);

  if (!isOpen) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Koordinat aman spotlight cutout
  const padding = currentStep?.id === 'map-hotspots-and-firebreak' ? 4 : 8;
  const maskX = targetRect ? Math.max(0, targetRect.left - padding) : 0;
  const maskY = targetRect ? Math.max(0, targetRect.top - padding) : 0;
  const maskW = targetRect ? Math.min(viewportDims.width - maskX, targetRect.width + padding * 2) : 0;
  const maskH = targetRect ? Math.min(viewportDims.height - maskY, targetRect.height + padding * 2) : 0;
  const cornerRadius = Math.min(16, Math.max(4, maskW / 2), Math.max(4, maskH / 2));

  // Path SVG dengan fillRule="evenodd":
  // Bagian luar (0,0 -> W,H) terisi gelap redup.
  // Bagian dalam (maskX, maskY -> maskW, maskH) terpotong fisik sehingga tembus pandang 100%
  // dan BEBAS DARI EVENT BLOCKING (klik tembus langsung ke tombol/peta/tabel di bawahnya).
  const backdropD = targetRect && maskW > 0 && maskH > 0
    ? `M 0 0 H ${viewportDims.width} V ${viewportDims.height} H 0 Z ` +
      `M ${maskX + cornerRadius} ${maskY} ` +
      `H ${maskX + maskW - cornerRadius} ` +
      `A ${cornerRadius} ${cornerRadius} 0 0 1 ${maskX + maskW} ${maskY + cornerRadius} ` +
      `V ${maskY + maskH - cornerRadius} ` +
      `A ${cornerRadius} ${cornerRadius} 0 0 1 ${maskX + maskW - cornerRadius} ${maskY + maskH} ` +
      `H ${maskX + cornerRadius} ` +
      `A ${cornerRadius} ${cornerRadius} 0 0 1 ${maskX} ${maskY + maskH - cornerRadius} ` +
      `V ${maskY + cornerRadius} ` +
      `A ${cornerRadius} ${cornerRadius} 0 0 1 ${maskX + cornerRadius} ${maskY} Z`
    : `M 0 0 H ${viewportDims.width} V ${viewportDims.height} H 0 Z`;

  return (
    <div
      className="coachmark-overlay-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coachmark-step-title"
      aria-describedby="coachmark-step-desc"
    >
      {/* ─── 1. Backdrop Glass & Cutout SVG Spotlight (True Click-Through) ─── */}
      <svg
        className="coachmark-backdrop-svg"
        aria-hidden="true"
        width="100%"
        height="100%"
      >
        {/* Latar belakang redup dengan cutout fisik evenodd */}
        <path
          className="coachmark-backdrop-path"
          d={backdropD}
          fillRule="evenodd"
        />

        {/* Cincin spotlight beranimasi dengan efek radiant flame */}
        {targetRect && maskW > 0 && maskH > 0 && (
          <rect
            className="coachmark-spotlight-ring"
            x={maskX}
            y={maskY}
            width={maskW}
            height={maskH}
            rx={cornerRadius}
            fill="none"
          />
        )}
      </svg>

      {/* ─── 2. Kartu Tooltip Tour Beranimasi ───────────────────────────────── */}
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          top: `${cardPlacement.top}px`,
          left: `${cardPlacement.left}px`,
        }}
        className="coachmark-card"
      >
        {/* Panah Penunjuk Pointer ke Target Element */}
        {cardPlacement.arrowSide === 'right' && (
          <div
            className="coachmark-arrow coachmark-arrow--right"
            style={{ top: `${cardPlacement.arrowOffset}px` }}
            aria-hidden="true"
          />
        )}
        {cardPlacement.arrowSide === 'top' && (
          <div
            className="coachmark-arrow coachmark-arrow--top"
            style={{ left: `${cardPlacement.arrowOffset}px` }}
            aria-hidden="true"
          />
        )}
        {cardPlacement.arrowSide === 'bottom' && (
          <div
            className="coachmark-arrow coachmark-arrow--bottom"
            style={{ left: `${cardPlacement.arrowOffset}px` }}
            aria-hidden="true"
          />
        )}
        {cardPlacement.arrowSide === 'left' && (
          <div
            className="coachmark-arrow coachmark-arrow--left"
            style={{ top: `${cardPlacement.arrowOffset}px` }}
            aria-hidden="true"
          />
        )}

        {/* Top Progress Track Bar */}
        <div className="coachmark-progress-track" aria-hidden="true">
          <div
            className="coachmark-progress-fill"
            style={{ width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Header Kartu */}
        <div className="coachmark-header">
          <div className="coachmark-step-badge">
            <span className="coachmark-badge-pulse" />
            <span>{currentStep.badge}</span>
          </div>

          <div className="coachmark-header-right">
            {/* Step Dot Indicators */}
            <div className="coachmark-dots-indicator" aria-hidden="true">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  tabIndex={-1}
                  className={`coachmark-dot ${
                    idx === currentStepIndex
                      ? 'coachmark-dot--active'
                      : idx < currentStepIndex
                      ? 'coachmark-dot--passed'
                      : ''
                  }`}
                  onClick={() => setCurrentStepIndex(idx)}
                  title={`Lompat ke langkah ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => handleDismiss(false)}
              className="coachmark-close-btn"
              title="Tutup panduan (Esc)"
              aria-label="Tutup panduan"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Judul & Subjudul */}
        <div className="coachmark-title-block">
          <h3 id="coachmark-step-title" className="coachmark-title">
            {currentStep.title}
          </h3>
          <p id="coachmark-step-desc" className="coachmark-subtitle">
            {currentStep.subtitle}
          </p>
        </div>

        {/* Daftar Kartu Mini Fitur (Rich Visual Chips) */}
        <div className="coachmark-chips-grid">
          {currentStep.chips.map((chip, idx) => (
            <div key={idx} className="coachmark-feature-chip">
              <div className="coachmark-chip-header">
                <span className="coachmark-chip-emoji" aria-hidden="true">
                  {chip.icon}
                </span>
                <strong className="coachmark-chip-title">{chip.title}</strong>
                {chip.tag && (
                  <span className={`coachmark-chip-tag coachmark-chip-tag--${chip.tagType || 'default'}`}>
                    {chip.tag}
                  </span>
                )}
              </div>
              <p className="coachmark-chip-desc">{chip.desc}</p>
            </div>
          ))}
        </div>

        {/* Pro-Tip Banner */}
        {currentStep.proTip && (
          <div className="coachmark-protip-banner">
            <span>{currentStep.proTip}</span>
          </div>
        )}

        {/* Footer Aksi & Opsi Jangan Tampilkan Lagi */}
        <div className="coachmark-footer">
          {/* Checkbox "Jangan tampilkan lagi" */}
          <label className="coachmark-checkbox-label" title="Jangan tampilkan tour saat membuka aplikasi">
            <input
              type="checkbox"
              id="coachmark-dont-show-checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="coachmark-checkbox-input"
            />
            <span className="coachmark-checkbox-custom" aria-hidden="true">
              {dontShowAgain && <CheckCircle2 size={13} />}
            </span>
            <span className="coachmark-checkbox-text">Jangan tampilkan lagi</span>
          </label>

          {/* Tombol Navigasi */}
          <div className="coachmark-actions-group">
            <button
              type="button"
              onClick={() => handleDismiss(false)}
              className="coachmark-skip-btn"
              title="Tutup panduan langsung"
            >
              Lewati (Skip)
            </button>

            {!isFirstStep && (
              <button
                type="button"
                onClick={handlePrev}
                className="coachmark-prev-btn"
                aria-label="Langkah sebelumnya"
              >
                <ChevronLeft size={16} />
                <span>Sebelumnya</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className={`coachmark-next-btn ${isLastStep ? 'coachmark-next-btn--finish' : ''}`}
            >
              <span>{isLastStep ? 'Selesai & Eksplorasi ✨' : 'Lanjut'}</span>
              {!isLastStep && <ChevronRight size={16} />}
            </button>
          </div>
        </div>

        {/* Petunjuk Keyboard Helper */}
        <div className="coachmark-keyboard-hint" aria-hidden="true">
          <span>Tekan <b>Esc</b> untuk tutup · Tombol panah <b>←</b> <b>→</b> untuk navigasi</span>
        </div>
      </div>
    </div>
  );
}
