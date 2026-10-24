/**
 * @file components/layout/Header.tsx
 * @description Header navigasi utama SiagaNusa.
 * Menampilkan: Logo, status pemantauan live, dan tombol toggle tema.
 */

'use client';

import Link from 'next/link';
import { Sun, Moon, Flame, RefreshCw, HelpCircle, Heart, Waves } from 'lucide-react';
import type { Theme } from '@/hooks/useTheme';
import type { HotspotSummary } from '@/types/disaster';

interface HeaderProps {
  theme: Theme;
  toggleTheme: () => void;
  summary: HotspotSummary | null;
  isLoading: boolean;
  fetchedAt: string | null;
  onOpenTour?: () => void;
  onOpenDonation?: () => void;
}

export default function Header({
  theme,
  toggleTheme,
  summary,
  isLoading,
  fetchedAt,
  onOpenTour,
  onOpenDonation,
}: HeaderProps) {
  const lastUpdateText = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <header className="site-header" role="banner">
      <div className="header-inner">
        {/* ─── Logo & Brand ─────────────────────────────────────────────── */}
        <div className="header-brand">
          <div className="header-logo" aria-hidden="true">
            <Flame size={22} />
          </div>
          <div className="header-brand-text">
            <span className="header-title">SiagaNusa</span>
            <span className="header-subtitle">Karhutla Watch</span>
          </div>
        </div>

        {/* ─── Live Status Badge ─────────────────────────────────────────── */}
        <div className="header-status" aria-live="polite" aria-label="Status pemantauan">
          {isLoading ? (
            <div className="status-badge status-badge--loading">
              <RefreshCw size={11} className="spin" aria-hidden="true" />
              <span>Memuat data...</span>
            </div>
          ) : summary ? (
            <div className="status-badge status-badge--live">
              <span className="status-dot" aria-hidden="true" />
              <span className="status-count">{summary.total.toLocaleString('id-ID')}</span>
              <span className="status-label">Titik Api Aktif</span>
              {lastUpdateText && (
                <span className="status-time">{lastUpdateText}</span>
              )}
            </div>
          ) : null}
        </div>

        <div className="header-actions">
          {/* Tombol Akses Simulator Tsunami */}
          <Link
            id="btn-header-tsunami"
            href="/tsunami"
            className="header-nav-btn header-tsunami-btn"
            title="Simulator Tsunami"
            aria-label="Simulator Tsunami"
          >
            <Waves size={15} className="header-nav-icon" />
            <span className="header-nav-label">
              <span className="header-label-long">Simulator Tsunami</span>
              <span className="header-label-short">Tsunami</span>
            </span>
          </Link>

          {onOpenDonation && (
            <button
              id="btn-header-donation"
              type="button"
              className="header-nav-btn header-donation-btn"
              onClick={onOpenDonation}
              title="Dukung / Donasi Operasional SiagaNusa via Saweria"
              aria-label="Donasi Saweria"
            >
              <Heart size={15} className="header-heart-icon header-nav-icon" />
              <span className="header-nav-label">
                <span className="header-label-long">Support</span>
                <span className="header-label-short">Support</span>
              </span>
            </button>
          )}

          {onOpenTour && (
            <button
              id="btn-header-open-tour"
              className="header-nav-btn header-tour-btn"
              onClick={onOpenTour}
              title="Buka Panduan Fitur (Coach Mark)"
              aria-label="Buka Panduan Fitur"
            >
              <HelpCircle size={15} className="header-nav-icon" />
              <span className="header-nav-label">
                <span className="header-label-long">Panduan</span>
                <span className="header-label-short">Panduan</span>
              </span>
            </button>
          )}

          <button
            id="btn-toggle-theme"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
}
