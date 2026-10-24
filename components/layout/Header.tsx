/**
 * @file components/layout/Header.tsx
 * @description Header navigasi utama SiagaNusa.
 * Menampilkan: Logo, status pemantauan live, tombol navigasi desktop,
 * tombol toggle tema, dan menu hamburger responsif untuk layar mobile & iPad.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Sun,
  Moon,
  Flame,
  RefreshCw,
  HelpCircle,
  Heart,
  Waves,
  Menu,
  X,
} from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const lastUpdateText = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : null;

  const closeMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Tutup menu saat pengguna menekan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };
    if (isMobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen, closeMenu]);

  // Kunci scroll body saat mobile menu terbuka
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileMenuOpen]);

  return (
    <header
      className={`site-header ${isMobileMenuOpen ? 'site-header--menu-open' : ''}`}
      role="banner"
    >
      <div className="header-inner">
        {/* ─── Logo & Brand ─────────────────────────────────────────────── */}
        <div className="header-brand">
          <Link href="/" className="header-brand-link" onClick={closeMenu}>
            <div className="header-logo" aria-hidden="true">
              <Flame size={22} />
            </div>
            <div className="header-brand-text">
              <span className="header-title">SiagaNusa</span>
              <span className="header-subtitle">Karhutla Watch</span>
            </div>
          </Link>
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

        {/* ─── Actions: Desktop Nav + Theme + Hamburger ─────────────────── */}
        <div className="header-actions">
          {/* Navigasi Desktop (HANYA tampil di layar desktop >= 1024px) */}
          <div className="header-desktop-actions">
            {/* Tombol Akses Simulator Tsunami */}
            <Link
              id="btn-header-tsunami"
              href="/tsunami"
              className="header-nav-btn header-tsunami-btn"
              title="Simulator Tsunami"
              aria-label="Simulator Tsunami"
            >
              <Waves size={15} className="header-nav-icon" />
              <span className="header-nav-label">Simulator Tsunami</span>
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
                <span className="header-nav-label">Support</span>
              </button>
            )}

            {onOpenTour && (
              <button
                id="btn-header-open-tour"
                type="button"
                className="header-nav-btn header-tour-btn"
                onClick={onOpenTour}
                title="Buka Panduan Fitur (Coach Mark)"
                aria-label="Buka Panduan Fitur"
              >
                <HelpCircle size={15} className="header-nav-icon" />
                <span className="header-nav-label">Panduan</span>
              </button>
            )}
          </div>

          {/* Toggle Tema (Selalu tersedia di desktop & mobile) */}
          <button
            id="btn-toggle-theme"
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Tombol Hamburger Menu (Aktif di layar < 1024px: Mobile & iPad) */}
          <button
            id="btn-mobile-menu"
            type="button"
            className={`header-menu-toggle ${isMobileMenuOpen ? 'header-menu-toggle--open' : ''}`}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            title={isMobileMenuOpen ? 'Tutup Menu' : 'Buka Menu Navigasi'}
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ─── Mobile Navigation Dropdown Menu (Render via Portal di luar DOM Tree Peta) ─── */}
      {isMobileMenuOpen && mounted && createPortal(
        <div className="mobile-nav-portal-root" data-theme={theme}>
          <div
            className="mobile-nav-backdrop"
            onClick={closeMenu}
            aria-hidden="true"
          />

          <div
            id="mobile-nav-drawer"
            className="mobile-nav-dropdown"
            role="dialog"
            aria-modal="true"
            aria-label="Menu Navigasi Mobile"
          >
            {/* Header info di dalam dropdown */}
            <div className="mobile-nav-dropdown-header">
              <span className="mobile-nav-dropdown-title">Menu Navigasi</span>
              {summary && (
                <div className="mobile-nav-status-badge">
                  <span className="mobile-nav-status-dot" aria-hidden="true" />
                  <span>{summary.total.toLocaleString('id-ID')} Titik Api Aktif</span>
                </div>
              )}
            </div>

            {/* Tombol-tombol navigasi utama (Rapi, konsisten, tidak berantakan) */}
            <div className="mobile-nav-buttons-list">
              {/* 1. Simulator Tsunami */}
              <Link
                id="mobile-nav-btn-tsunami"
                href="/tsunami"
                className="mobile-menu-btn mobile-menu-btn--tsunami"
                onClick={closeMenu}
              >
                <div className="mobile-menu-btn-left">
                  <Waves size={18} className="mobile-menu-icon" />
                  <span className="mobile-menu-btn-text">Simulator Tsunami</span>
                </div>
                <span className="mobile-menu-pill mobile-menu-pill--cyan">Baru ✨</span>
              </Link>

              {/* 2. Dukungan Donasi Saweria */}
              {onOpenDonation && (
                <button
                  id="mobile-nav-btn-donation"
                  type="button"
                  className="mobile-menu-btn mobile-menu-btn--donation"
                  onClick={() => {
                    closeMenu();
                    onOpenDonation();
                  }}
                >
                  <div className="mobile-menu-btn-left">
                    <Heart size={18} className="mobile-menu-icon mobile-menu-heart-fill" />
                    <span className="mobile-menu-btn-text">Support (Donasi Saweria)</span>
                  </div>
                  <span className="mobile-menu-pill mobile-menu-pill--orange">Saweria</span>
                </button>
              )}

              {/* 3. Panduan Fitur (Coach Mark Tour) */}
              {onOpenTour && (
                <button
                  id="mobile-nav-btn-tour"
                  type="button"
                  className="mobile-menu-btn mobile-menu-btn--tour"
                  onClick={() => {
                    closeMenu();
                    onOpenTour();
                  }}
                >
                  <div className="mobile-menu-btn-left">
                    <HelpCircle size={18} className="mobile-menu-icon" />
                    <span className="mobile-menu-btn-text">Panduan Fitur (Tour)</span>
                  </div>
                  <span className="mobile-menu-pill mobile-menu-pill--red">Panduan</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
