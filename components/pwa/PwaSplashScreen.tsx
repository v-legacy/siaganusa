/**
 * @file components/pwa/PwaSplashScreen.tsx
 * @description Splash screen transisi awal (startup) SiagaNusa untuk Android & iOS.
 * Menampilkan logo api dengan peta pulau Indonesia dan satelit dari og-siaganusa,
 * memberikan pengalaman native app yang mulus sebelum peta interaktif siap.
 */

'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Image from 'next/image';

const emptySubscribe = () => () => {};

export default function PwaSplashScreen() {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isFading, setIsFading] = useState<boolean>(false);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    // Jalankan splash screen hanya pada load awal
    // Mulai animasi fade-out setelah 900ms
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 900);

    // Hapus total dari DOM setelah animasi fade-out selesai (1400ms)
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!mounted || !isVisible) {
    return null;
  }

  return (
    <div
      className={`pwa-app-splash ${isFading ? 'pwa-app-splash--fade' : ''}`}
      aria-hidden="true"
      onClick={() => setIsVisible(false)}
    >
      <div className="pwa-splash-inner">
        {/* Logo Api & Pulau Indonesia (SiagaNusa Emblem) */}
        <div className="pwa-splash-logo-box">
          <Image
            src="/icon.png"
            alt="SiagaNusa Emblem"
            width={128}
            height={128}
            priority
            className="pwa-splash-logo-img"
          />
          <div className="pwa-splash-glow-ring" />
        </div>

        {/* Brand Text */}
        <div className="pwa-splash-text-box">
          <h1 className="pwa-splash-title">SiagaNusa</h1>
          <p className="pwa-splash-subtitle">Pemantauan Bencana Indonesia Real-Time</p>
        </div>

        {/* Minimalist Progress Indicator */}
        <div className="pwa-splash-loader">
          <div className="pwa-splash-progress-bar" />
        </div>
      </div>
    </div>
  );
}
