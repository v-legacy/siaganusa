/**
 * @file components/pwa/PwaProvider.tsx
 * @description Provider & Koordinator PWA (Progressive Web App) SiagaNusa.
 * Bertanggung jawab atas:
 * 1. Pendaftaran Service Worker (/sw.js)
 * 2. Deteksi mode aplikasi (apakah sudah dibuka dari Home Screen / Standalone)
 * 3. Menangkap event `beforeinstallprompt` (Android/Chrome)
 * 4. Mendeteksi perangkat iOS (iPhone / iPad) untuk instruksi Safari
 * 5. Pengelolaan auto-popup dengan delay ramah pengguna serta penyimpanan preferensi dismiss
 * 6. Global event listener 'open-pwa-install' agar dapat dibuka dari tombol Header / menu mana saja
 */

'use client';

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import PwaInstallModal from './PwaInstallModal';
import PwaSplashScreen from './PwaSplashScreen';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_STORAGE_KEY = 'siaganusa_pwa_dismissed_v1';
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 hari cooldown sebelum prompt ulang otomatis

const emptySubscribe = () => () => {};

export default function PwaProvider() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [canPromptNative, setCanPromptNative] = useState<boolean>(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState<boolean>(false);

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Deteksi mode Standalone via useSyncExternalStore (Bebas lint error, SSR safe)
  const isStandalone = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {};
      const mql = window.matchMedia('(display-mode: standalone)');
      mql.addEventListener('change', onStoreChange);
      return () => mql.removeEventListener('change', onStoreChange);
    },
    () => {
      if (typeof window === 'undefined') return false;
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://')
      );
    },
    () => false
  );

  // Deteksi perangkat iOS via useSyncExternalStore
  const isIOS = useSyncExternalStore(
    emptySubscribe,
    () => {
      if (typeof window === 'undefined') return false;
      const userAgent = window.navigator.userAgent || '';
      return /iPad|iPhone|iPod/.test(userAgent) && !('MSStream' in window);
    },
    () => false
  );

  // Deteksi apakah sedang dibuka di dalam In-App Browser (Instagram, WhatsApp, TikTok, FB, Line dsb)
  const isInAppBrowser = useSyncExternalStore(
    emptySubscribe,
    () => {
      if (typeof window === 'undefined') return false;
      const ua = window.navigator.userAgent || '';
      const isApple = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
      return (
        isApple &&
        /FBAN|FBAV|Instagram|TikTok|Line|Twitter|MicroMessenger|WhatsApp|Snapchat/i.test(ua)
      );
    },
    () => false
  );

  // 1. Pendaftaran Service Worker
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          if (reg.installing) {
            console.debug('[PWA] Service worker installing');
          } else if (reg.active) {
            console.debug('[PWA] Service worker active');
          }
        })
        .catch((err) => {
          console.warn('[PWA] Service worker registration error:', err);
        });
    }
  }, []);

  // 2. Event Listeners untuk Install Prompt & Manual Open
  useEffect(() => {
    if (typeof window === 'undefined' || isStandalone) return;

    // Tangani event beforeinstallprompt (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanPromptNative(true);
    };

    // Tangani event appinstalled
    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setCanPromptNative(false);
      setInstalledSuccessfully(true);
      localStorage.removeItem(DISMISS_STORAGE_KEY);
      setTimeout(() => {
        setIsOpen(false);
      }, 3500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Global Event Listener untuk tombol manual di Header / Menu
    const handleManualOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-pwa-install', handleManualOpen);

    // Cek apakah boleh auto-popup setelah jeda ramah (3.5 detik)
    const lastDismissed = localStorage.getItem(DISMISS_STORAGE_KEY);
    const now = Date.now();
    const isCooldownActive =
      lastDismissed && now - parseInt(lastDismissed, 10) < DISMISS_COOLDOWN_MS;

    let autoTimer: NodeJS.Timeout | null = null;
    if (!isCooldownActive) {
      autoTimer = setTimeout(() => {
        setIsOpen(true);
      }, 3500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-pwa-install', handleManualOpen);
      if (autoTimer) clearTimeout(autoTimer);
    };
  }, [isStandalone]);

  // Handler Tutup / Nanti Saja
  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
    }
  }, []);

  // Handler Pemasangan Native (Android/Chromium)
  const handleInstallNative = useCallback(async (): Promise<boolean> => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) return false;

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        deferredPromptRef.current = null;
        setCanPromptNative(false);
        setInstalledSuccessfully(true);
        setTimeout(() => {
          setIsOpen(false);
        }, 3000);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[PWA] Prompt error:', err);
      return false;
    }
  }, []);

  return (
    <>
      <PwaSplashScreen />
      {!isStandalone && (
        <PwaInstallModal
          isOpen={isOpen}
          onClose={handleClose}
          isIOS={isIOS}
          isInAppBrowser={isInAppBrowser}
          isStandalone={isStandalone}
          canPromptNative={canPromptNative}
          onInstallNative={handleInstallNative}
          installedSuccessfully={installedSuccessfully}
        />
      )}
    </>
  );
}
