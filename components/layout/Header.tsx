/**
 * @file components/layout/Header.tsx
 * @description Header navigasi utama SiagaNusa.
 * Menampilkan: Logo, status pemantauan live, dan tombol toggle tema.
 */

'use client';

import { Sun, Moon, Flame, RefreshCw, HelpCircle, Heart } from 'lucide-react';
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

        {/* ─── Action Buttons ────────────────────────────────────────────── */}
        <div className="header-actions">
          {onOpenDonation && (
            <button
              id="btn-header-donation"
              type="button"
              className="header-donation-btn"
              onClick={onOpenDonation}
              title="Dukung / Donasi Operasional SiagaNusa via Saweria"
              aria-label="Donasi Saweria"
            >
              <Heart size={15} className="header-heart-icon" />
              <span>Support</span>
            </button>
          )}

          {onOpenTour && (
            <button
              id="btn-header-open-tour"
              className="header-tour-btn"
              onClick={onOpenTour}
              title="Buka Panduan Fitur (Coach Mark)"
              aria-label="Buka Panduan Fitur"
            >
              <HelpCircle size={15} />
              <span>Panduan</span>
            </button>
          )}

          <button
            id="btn-toggle-theme"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
