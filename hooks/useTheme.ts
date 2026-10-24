/**
 * @file hooks/useTheme.ts
 * @description Custom hook untuk manajemen tema Light/Dark Mode pada SiagaNusa.
 *
 * Perilaku:
 * 1. Saat pertama mount, baca preferensi tersimpan dari localStorage.
 * 2. Jika tidak ada preferensi tersimpan, gunakan preferensi sistem OS (`prefers-color-scheme`).
 * 3. Toggle manual menyimpan pilihan ke localStorage dan mengubah atribut `data-theme` pada <html>.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'siaganusa-theme';

interface UseThemeReturn {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

export function useTheme(): UseThemeReturn {
  const [theme, setTheme] = useState<Theme>('light');

  // Inisialisasi tema dari localStorage atau preferensi sistem
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(stored);
      applyTheme(stored);
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme: Theme = systemPrefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      applyTheme(initialTheme);
    }
  }, []);

  // Listen perubahan preferensi sistem (jika user tidak menyetel manual)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Hanya ikuti sistem jika tidak ada preferensi manual tersimpan
      if (!stored) {
        const systemTheme: Theme = e.matches ? 'dark' : 'light';
        setTheme(systemTheme);
        applyTheme(systemTheme);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme, isDark: theme === 'dark' };
}

/** Menerapkan tema ke elemen `<html>` dengan atribut data-theme */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  // Tambahkan / hapus class 'dark' untuk kompatibilitas Tailwind dark mode
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
