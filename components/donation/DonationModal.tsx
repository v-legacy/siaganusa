/**
 * @file components/donation/DonationModal.tsx
 * @description Modal Donasi Saweria SiagaNusa.
 * Desain terpusat (Center), menarik, dan premium:
 * - Top: Glow ambient aura, Pill badge dukungan, Avatar bebek Saweria dengan pulsing ring & floating heartbeat
 * - Header: Judul & username kreator @levystudios terverifikasi (100% Center)
 * - Quote Pill: "Bantu Jaga Aplikasi Ini Tetap Gratis & Aktif" (100% Center)
 * - Hero QRIS Card: Frame Barcode QRIS nasional dengan red header strip, viewfinder reticle,
 *   subtle scanner line, dan logo bebek di tengah (100% Center)
 * - Action: Tombol Buka Saweria & Salin Link dengan feedback visual (100% Center)
 */

'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Heart,
  Sparkles,
} from 'lucide-react';

const emptySubscribe = () => () => {};

export const SAWERIA_CONFIG = {
  streamKey: '96a027982f3b157e2ee6a9e254e985c3',
  username: 'levystudios',
  merchantName: 'LEVYSTUDIOS · SIAGANUSA',
  title: 'Bantu Jaga Aplikasi Ini Tetap Gratis & Aktif',
  profileUrl: 'https://saweria.co/levystudios',
  widgetUrl: 'https://saweria.co/widgets/qr?streamKey=96a027982f3b157e2ee6a9e254e985c3',
};

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DonationModal({ isOpen, onClose }: DonationModalProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [isCopied, setIsCopied] = useState<boolean>(false);

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

  // Salin link profil Saweria
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SAWERIA_CONFIG.profileUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    } catch (err) {
      console.warn('Gagal menyalin link Saweria:', err);
    }
  }, []);

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      className="donation-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-modal-title"
      onClick={onClose}
    >
      <div
        className="donation-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Accent Bar */}
        <div className="donation-card-top-accent" aria-hidden="true" />

        {/* Tombol Tutup (X) */}
        <button
          className="donation-modal-close-btn"
          onClick={onClose}
          aria-label="Tutup jendela donasi"
          title="Tutup (Esc)"
          type="button"
        >
          <X size={18} />
        </button>

        {/* ─── Header: Identitas Saweria (100% Center) ────────────────────── */}
        <div className="donation-modal-header">
          {/* Top Pill Tag */}
          <div className="donation-support-pill" aria-hidden="true">
            <Sparkles size={12} className="donation-pill-sparkle" />
            <span>TRAKTIR & DUKUNG SIAGANUSA</span>
          </div>

          {/* Avatar Ring dengan Floating Pulsing Heart */}
          <div className="saweria-avatar-container">
            <div className="saweria-avatar-ring">
              <Image
                src="/images/saweria-duck.png"
                alt="Saweria Logo"
                width={48}
                height={48}
                className="saweria-avatar-img"
                priority
              />
            </div>
            <span className="saweria-floating-heart" aria-hidden="true">
              <Heart size={11} fill="currentColor" />
            </span>
          </div>

          {/* Judul & Kreator */}
          <div className="donation-creator-meta">
            <h3 id="donation-modal-title" className="donation-modal-title">
              Dukungan SiagaNusa
            </h3>
            <div className="donation-creator-handle">
              <span className="handle-text">@{SAWERIA_CONFIG.username}</span>
              <span className="handle-dot">·</span>
              <span className="handle-badge">
                <ShieldCheck size={12} />
                <span>Saweria Terverifikasi</span>
              </span>
            </div>
          </div>

          {/* Pesan Personal dari Widget */}
          <div className="donation-quote-bubble">
            <p className="donation-quote-text">
              &ldquo;{SAWERIA_CONFIG.title}&rdquo;
            </p>
          </div>
        </div>

        {/* ─── Hero QRIS Barcode Card (100% Center & Menarik) ─────────────── */}
        <div className="donation-qr-card-wrapper">
          <div className="donation-qr-card">
            {/* Red QRIS Header Ribbon */}
            <div className="qris-header-strip" aria-hidden="true">
              <div className="qris-brand-row">
                <span className="qris-brand-logo">QRIS</span>
                <span className="qris-brand-tag">GPN</span>
              </div>
              <span className="qris-header-subtext">PEMBAYARAN DIGITAL NASIONAL</span>
            </div>

            {/* Viewfinder Scanner Reticle & Barcode */}
            <div className="donation-qr-viewfinder">
              {/* Corner Reticle Brackets */}
              <span className="viewfinder-corner viewfinder-corner--tl" aria-hidden="true" />
              <span className="viewfinder-corner viewfinder-corner--tr" aria-hidden="true" />
              <span className="viewfinder-corner viewfinder-corner--bl" aria-hidden="true" />
              <span className="viewfinder-corner viewfinder-corner--br" aria-hidden="true" />

              {/* Laser Scan Line Animation */}
              <div className="viewfinder-laser-line" aria-hidden="true" />

              <div className="donation-qr-image-box">
                {/* Gunakan SVG Vector QR untuk ketajaman maksimal tanpa blur */}
                <Image
                  src="/images/saweria-qr.svg"
                  alt={`Barcode QRIS Saweria @${SAWERIA_CONFIG.username}`}
                  width={204}
                  height={204}
                  className="donation-qr-render"
                  priority
                  unoptimized
                />
                {/* Badge Maskot Saweria di Tengah Barcode */}
                <div className="donation-qr-center-mascot" aria-hidden="true">
                  <Image
                    src="/images/saweria-duck.png"
                    alt="Saweria Mascot"
                    width={26}
                    height={26}
                    className="donation-duck-center-img"
                  />
                </div>
              </div>
            </div>

            <p className="donation-scan-instruction">
              Scan barcode di atas menggunakan aplikasi e-Wallet atau Mobile Banking Anda
            </p>
          </div>
        </div>

        {/* ─── Tombol Aksi (100% Center) ──────────────────────────────────── */}
        <div className="donation-actions-footer">
          <a
            id="btn-open-saweria-link"
            href={SAWERIA_CONFIG.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="donation-btn donation-btn--primary"
          >
            <Sparkles size={16} />
            <span>Buka Halaman Saweria</span>
            <ExternalLink size={14} />
          </a>

          <button
            id="btn-copy-saweria-link"
            type="button"
            className="donation-btn donation-btn--secondary"
            onClick={handleCopy}
          >
            {isCopied ? (
              <>
                <Check size={16} className="donation-icon-check" />
                <span>Link Berhasil Disalin!</span>
              </>
            ) : (
              <>
                <Copy size={15} />
                <span>Salin Link Saweria</span>
              </>
            )}
          </button>
        </div>

        {/* Footnote Terima Kasih (100% Center) */}
        <p className="donation-closing-text">
          Setiap dukungan Anda sangat berarti untuk menjaga server satelit NASA FIRMS & infrastruktur
          SiagaNusa tetap aktif gratis. Terima kasih! 🙏
        </p>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
