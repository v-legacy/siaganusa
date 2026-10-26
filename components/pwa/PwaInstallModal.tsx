/**
 * @file components/pwa/PwaInstallModal.tsx
 * @description Modal Pop-up "Pasang Aplikasi / Add to Home Screen" SiagaNusa.
 * Desain konsisten dengan SiagaNusa Design System (Glassmorphism, dark/light mode, mobile-first):
 * - Otomatis menyesuaikan platform (Android / Chrome vs iOS Safari)
 * - Android: Tombol 1-klik pemicu native install prompt + opsi fallback
 * - iOS / iPhone: Panduan visual interaktif 3 langkah (Tombol Share -> Tambah ke Layar Utama)
 * - Responsive: Bottom-sheet geser halus di mobile, modal terpusat di desktop
 */

'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
  X,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  Zap,
  Maximize2,
  ShieldAlert,
  ArrowDown,
  AlertTriangle,
} from 'lucide-react';

const emptySubscribe = () => () => {};

export interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isInAppBrowser?: boolean;
  isStandalone: boolean;
  canPromptNative: boolean;
  onInstallNative: () => Promise<boolean>;
  installedSuccessfully: boolean;
}

export default function PwaInstallModal({
  isOpen,
  onClose,
  isIOS,
  isInAppBrowser = false,
  isStandalone,
  canPromptNative,
  onInstallNative,
  installedSuccessfully,
}: PwaInstallModalProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  // Tutup dengan tombol Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Kunci scroll body saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Jangan render apapun jika belum mounted atau modal tidak dibuka
  if (!mounted || !isOpen || isStandalone) {
    return null;
  }

  const handleNativeClick = async () => {
    try {
      setIsInstalling(true);
      const success = await onInstallNative();
      if (!success) {
        setIsInstalling(false);
      }
    } catch {
      setIsInstalling(false);
    }
  };

  return createPortal(
    <div
      className="pwa-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-modal-title"
    >
      {/* Backdrop Klik untuk menutup */}
      <div className="pwa-modal-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Modal Card (Bottom-Sheet di Mobile, Centered Modal di Tablet/Desktop) */}
      <div className="pwa-modal-card">
        {/* Mobile Swipe / Sheet Handle */}
        <div className="pwa-sheet-handle" aria-hidden="true" />

        {/* Ambient Top Glow Effect */}
        <div className="pwa-modal-glow" aria-hidden="true" />

        {/* Tombol Tutup X */}
        <button
          id="btn-close-pwa-modal"
          type="button"
          className="pwa-modal-close-btn"
          onClick={onClose}
          aria-label="Tutup jendela pasang aplikasi"
        >
          <X size={18} />
        </button>

        {/* State Berhasil Terpasang */}
        {installedSuccessfully ? (
          <div className="pwa-success-content">
            <div className="pwa-success-icon-wrap">
              <CheckCircle2 size={44} className="text-emerald-500" />
            </div>
            <h2 className="pwa-success-title">Aplikasi SiagaNusa Berhasil Dipasang!</h2>
            <p className="pwa-success-desc">
              Ikon SiagaNusa kini telah tersedia di layar utama smartphone Anda. Anda dapat membukanya kapan saja seperti aplikasi resmi tanpa web browser.
            </p>
            <button
              type="button"
              className="pwa-btn-primary pwa-btn-full"
              onClick={onClose}
            >
              Mulai Gunakan Aplikasi
            </button>
          </div>
        ) : (
          /* Konten Utama Penawaran Install */
          <div className="pwa-main-content">
            {/* Header: Ikon App & Badge */}
            <div className="pwa-header-row">
              <div className="pwa-app-icon-wrap">
                <Image
                  src="/icon.png"
                  alt="Ikon SiagaNusa"
                  width={56}
                  height={56}
                  className="pwa-app-icon"
                  priority
                />
                <span className="pwa-icon-badge" title="PWA Siap Dipasang">
                  <Sparkles size={11} />
                </span>
              </div>
              <div className="pwa-header-text">
                <div className="pwa-pill-badge">
                  <span className="pwa-pill-dot" />
                  <span>Aplikasi Resmi Web (PWA)</span>
                </div>
                <h2 id="pwa-modal-title" className="pwa-modal-title">
                  Pasang Aplikasi SiagaNusa
                </h2>
                <p className="pwa-modal-subtitle">
                  Buka langsung dari Layar Utama HP tanpa browser
                </p>
              </div>
            </div>

            {/* Keunggulan PWA (Pills / Grid Ringkas) */}
            <div className="pwa-benefits-grid">
              <div className="pwa-benefit-item">
                <div className="pwa-benefit-icon-box">
                  <Zap size={16} />
                </div>
                <div className="pwa-benefit-info">
                  <span className="pwa-benefit-name">Buka 1 Ketukan</span>
                  <span className="pwa-benefit-desc">Langsung di home screen</span>
                </div>
              </div>

              <div className="pwa-benefit-item">
                <div className="pwa-benefit-icon-box">
                  <Maximize2 size={16} />
                </div>
                <div className="pwa-benefit-info">
                  <span className="pwa-benefit-name">Layar Penuh (Full)</span>
                  <span className="pwa-benefit-desc">Bebas bilah URL browser</span>
                </div>
              </div>

              <div className="pwa-benefit-item">
                <div className="pwa-benefit-icon-box">
                  <Smartphone size={16} />
                </div>
                <div className="pwa-benefit-info">
                  <span className="pwa-benefit-name">Sangat Ringan</span>
                  <span className="pwa-benefit-desc">Hemat memori & kuota HP</span>
                </div>
              </div>

              <div className="pwa-benefit-item">
                <div className="pwa-benefit-icon-box">
                  <ShieldAlert size={16} />
                </div>
                <div className="pwa-benefit-info">
                  <span className="pwa-benefit-name">Pantau Real-Time</span>
                  <span className="pwa-benefit-desc">Titik api & tsunami live</span>
                </div>
              </div>
            </div>

            {/* Bagian Instruksi Berdasarkan Perangkat */}
            {isIOS ? (
              isInAppBrowser ? (
                /* Deteksi In-App Browser di iOS (Instagram/TikTok/WhatsApp) */
                <div className="pwa-inapp-warning-box">
                  <div className="pwa-inapp-warning-header">
                    <AlertTriangle size={18} />
                    <span>Buka Melalui Safari Terlebih Dahulu</span>
                  </div>
                  <p className="pwa-inapp-desc">
                    Anda sedang membuka tautan di browser internal aplikasi. Sistem iOS hanya mengizinkan penambahan aplikasi ke layar utama melalui peramban resmi <strong>Safari</strong>.
                  </p>
                  <ol className="pwa-ios-steps-list">
                    <li className="pwa-ios-step">
                      <div className="pwa-step-number">1</div>
                      <div className="pwa-step-text">
                        Ketuk ikon menu titik tiga (<strong>⋯</strong>) atau ikon <strong>Bagikan</strong> di pojok atas aplikasi ini.
                      </div>
                    </li>
                    <li className="pwa-ios-step">
                      <div className="pwa-step-number">2</div>
                      <div className="pwa-step-text">
                        Pilih <strong>&quot;Buka di Safari&quot;</strong> (<em>Open in Safari</em>).
                      </div>
                    </li>
                    <li className="pwa-ios-step">
                      <div className="pwa-step-number">3</div>
                      <div className="pwa-step-text">
                        Setelah terbuka di Safari, ikuti menu <strong>Bagikan ⎋</strong> lalu pilih <strong>&quot;Tambah ke Layar Utama&quot;</strong>.
                      </div>
                    </li>
                  </ol>
                </div>
              ) : (
                /* Panduan Khusus iOS Safari Normal */
                <div className="pwa-ios-guide-box">
                  <div className="pwa-ios-guide-header">
                    <span className="pwa-ios-apple-icon"></span>
                    <span className="pwa-ios-guide-title">
                      Petunjuk Pemasangan di iPhone / iPad:
                    </span>
                  </div>

                  <ol className="pwa-ios-steps-list">
                    <li className="pwa-ios-step">
                      <div className="pwa-step-number">1</div>
                      <div className="pwa-step-text">
                        Ketuk tombol <strong>Bagikan (Share)</strong>{' '}
                        <span className="pwa-inline-icon">
                          <Share size={15} />
                        </span>{' '}
                        pada bilah navigasi Safari di bagian bawah layar.
                      </div>
                    </li>
                    <li className="pwa-ios-step">
                      <div className="pwa-step-number">2</div>
                      <div className="pwa-step-text">
                        Gulir menu ke bawah lalu pilih{' '}
                        <strong>&quot;Tambah ke Layar Utama&quot;</strong>{' '}
                        <span className="pwa-inline-icon">
                          <PlusSquare size={15} />
                        </span>
                        (<em>Add to Home Screen</em>).
                      </div>
                    </li>
                    <li className="pwa-ios-step">
                      <div className="pwa-step-number">3</div>
                      <div className="pwa-step-text">
                        Ketuk <strong>&quot;Tambah&quot;</strong> (<em>Add</em>) di sudut kanan atas layar untuk menyelesaikan.
                      </div>
                    </li>
                  </ol>

                  {/* Animated pointer indicator di mobile Safari */}
                  <div className="pwa-ios-hint-footer">
                    <ArrowDown size={14} className="pwa-bounce-arrow" />
                    <span>Tombol bagikan ada di bilah bawah browser Safari Anda</span>
                  </div>
                </div>
              )
            ) : (
              /* Android / Chromium / Desktop */
              canPromptNative ? (
                <div className="pwa-native-prompt-box">
                  <p className="pwa-native-hint">
                    Tekan tombol di bawah untuk memasang SiagaNusa langsung ke beranda perangkat Anda secara otomatis.
                  </p>
                </div>
              ) : (
                /* Fallback Android jika browser memblokir prompt otomatis */
                <div className="pwa-android-fallback-box">
                  <p className="pwa-fallback-title">Cara Pasang Manual di Browser Android:</p>
                  <ol className="pwa-ios-steps-list">
                    <li className="pwa-ios-step">
                      <div className="pwa-step-number">1</div>
                      <div className="pwa-step-text">
                        Ketuk menu titik tiga (<strong>⋮</strong>) di sudut kanan atas browser.
                      </div>
                    </li>
                    <li className="pwa-ios-step">
                      <div className="pwa-step-number">2</div>
                      <div className="pwa-step-text">
                        Pilih <strong>&quot;Instal aplikasi&quot;</strong> atau <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.
                      </div>
                    </li>
                  </ol>
                </div>
              )
            )}

            {/* Action Buttons */}
            <div className="pwa-action-buttons">
              {isIOS ? (
                <button
                  id="btn-pwa-ios-dismiss"
                  type="button"
                  className="pwa-btn-primary pwa-btn-full"
                  onClick={onClose}
                >
                  Saya Mengerti
                </button>
              ) : canPromptNative ? (
                <>
                  <button
                    id="btn-pwa-install-now"
                    type="button"
                    className="pwa-btn-primary pwa-btn-glow"
                    onClick={handleNativeClick}
                    disabled={isInstalling}
                  >
                    <Smartphone size={17} />
                    <span>{isInstalling ? 'Memproses...' : 'Pasang Sekarang'}</span>
                  </button>
                  <button
                    id="btn-pwa-dismiss"
                    type="button"
                    className="pwa-btn-secondary"
                    onClick={onClose}
                  >
                    Nanti Saja
                  </button>
                </>
              ) : (
                <button
                  id="btn-pwa-fallback-dismiss"
                  type="button"
                  className="pwa-btn-primary pwa-btn-full"
                  onClick={onClose}
                >
                  Tutup Panduan
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
